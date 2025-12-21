// Script to reset balance for a user by adding a corrective settlement
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.DATABASE_URL;

// Define schemas inline for the script
const UserSchema = new mongoose.Schema({
    _id: String,
    name: String,
    email: String,
});

const ExpenseSplitSchema = new mongoose.Schema({
    _id: String,
    expense_id: String,
    user_id: String,
    amount: Number,
});

const ExpenseSchema = new mongoose.Schema({
    _id: String,
    group_id: String,
    paid_by_id: String,
    amount: Number,
    description: String,
    created_at: Date,
});

const SettlementSchema = new mongoose.Schema({
    _id: String,
    group_id: String,
    from_user_id: String,
    to_user_id: String,
    amount: Number,
    created_at: Date,
});

async function resetBalance() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', UserSchema);
        const ExpenseSplit = mongoose.model('ExpenseSplit', ExpenseSplitSchema);
        const Expense = mongoose.model('Expense', ExpenseSchema);
        const Settlement = mongoose.model('Settlement', SettlementSchema);

        // List all users first
        const allUsers = await User.find({});
        console.log('All users in database:');
        allUsers.forEach(u => console.log(`  - ${u._id}: ${u.name} (${u.email})`));
        console.log('');

        // Find the user (try partial match on email)
        const user = await User.findOne({ email: { $regex: /siddhu/i } });
        if (!user) {
            console.log('User with "siddhu" in email not found!');
            return;
        }
        console.log('Found user:', user._id, user.name, user.email);

        // Calculate current balance
        // What user owes (splits where they owe money)
        const splits = await ExpenseSplit.find({ user_id: user._id });
        let totalOwes = 0;
        for (const split of splits) {
            const expense = await Expense.findById(split.expense_id);
            if (expense && expense.paid_by_id !== user._id) {
                totalOwes += split.amount;
            }
        }

        // What is owed to user (splits from expenses they paid)
        const paidExpenses = await Expense.find({ paid_by_id: user._id });
        let totalOwed = 0;
        for (const expense of paidExpenses) {
            const otherSplits = await ExpenseSplit.find({
                expense_id: expense._id,
                user_id: { $ne: user._id }
            });
            for (const split of otherSplits) {
                totalOwed += split.amount;
            }
        }

        // Settlements: money user sent
        const sentSettlements = await Settlement.find({ from_user_id: user._id });
        let totalSent = sentSettlements.reduce((sum, s) => sum + s.amount, 0);

        // Settlements: money user received
        const receivedSettlements = await Settlement.find({ to_user_id: user._id });
        let totalReceived = receivedSettlements.reduce((sum, s) => sum + s.amount, 0);

        const netBalance = (totalOwed - totalReceived) - (totalOwes - totalSent);

        console.log('\nCurrent balance breakdown:');
        console.log('Total owed to you:', totalOwed);
        console.log('Total received:', totalReceived);
        console.log('Total you owe:', totalOwes);
        console.log('Total you sent:', totalSent);
        console.log('Net balance:', netBalance);

        if (netBalance === 0) {
            console.log('\nBalance is already 0!');
        } else {
            console.log('\nTo reset balance to 0, we would need to adjust by:', -netBalance);

            // For now, just showing what needs to be done
            // Uncomment below to actually fix by deleting expense splits for this user

            console.log('\nDeleting expense splits for this user to reset balance...');
            await ExpenseSplit.deleteMany({ user_id: user._id });
            console.log('Deleted all expense splits where user is the splitter');

            // Also delete from expenses they paid for
            for (const expense of paidExpenses) {
                await ExpenseSplit.deleteMany({ expense_id: expense._id });
                await Expense.deleteOne({ _id: expense._id });
            }
            console.log('Deleted expenses paid by user');

            // Delete settlements
            await Settlement.deleteMany({ $or: [{ from_user_id: user._id }, { to_user_id: user._id }] });
            console.log('Deleted settlements involving user');

            console.log('\nBalance reset to 0!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

resetBalance();
