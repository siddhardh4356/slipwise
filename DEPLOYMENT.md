# Deploying SlipWise to the Web

Since SlipWise uses a database, you cannot just drag-and-drop it to a static host. You need a **Database Provider** and a **Web Host**.

## 1. Get a Cloud Database (MySQL)

You need a MySQL database that is accessible from the internet.
**Recommendation**: [Aiven](https://aiven.io/) (Free tier available) or [PlanetScale](https://planetscale.com/).

### Steps (Example for Aiven):
1.  Sign up at Aiven.io.
2.  Create a new **MySQL** service (select the Free Plan if available).
3.  Once running, copy the **Service URI** (it looks like `mysql://avnadmin:password@host:port/defaultdb`).

## 2. Prepare Your Code
1.  Ensure your `schema.prisma` is up to date.
2.  Push your code to **GitHub**.

## 3. Deploy to Vercel
1.  Go to [Vercel.com](https://vercel.com) and sign up/login.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `slipwise` GitHub repository.
4.  **Environment Variables**:
    - In the "Environment Variables" section, add the following (using details from your Cloud Database):
        - `DB_HOST`: The hostname (e.g., `mysql-service.aivencloud.com`)
        - `DB_USER`: The username (e.g., `avnadmin`)
        - `DB_PASSWORD`: The password
        - `DB_NAME`: The database name (e.g., `defaultdb`)

5.  Click **Deploy**.

## 4. Set up the Database Schema
Once deployed, Vercel will build the site, but your database is empty. You need to push the tables.

1.  On your local machine, creating a temporary `.env.production` file with your Cloud Database credentials.
2.  Run the following command:
    ```bash
    npx prisma db push
    ```
    *(Make sure `DATABASE_URL` in your schema or environment points to the Cloud DB for this step, or manually configure the connection string).*

    **Easier Alternative**:
    In Vercel, you can use the "Build Command" to include migration, but it's often safer to run it locally pointing to the remote DB once.

## 5. Invite Friends!
Once deployed, you will get a URL (like `https://slipwise.vercel.app`).
1.  Share this link with your friends.
2.  They can Sign Up.
3.  Create a Group and copy the **Join Code** from the dashboard.
4.  Send them the Join Code.
