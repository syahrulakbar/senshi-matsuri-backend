# Akita Japan Fest - API

I am currently developing a comprehensive event organizer platform as a side project to enhance my skills in Next.js and modern web development.

This project is not only aimed at streamlining event organization but also serves as a hands-on learning experience in building scalable and efficient web applications.

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

```bash
# Server Config
SERVER_PORT = 5000
CORS_PORT = 3000

SUPABASE_KEY = [YOUR_SUPABASE_KEY]

EMAIL = [YOUR_EMAIL]
PASSWORD = [YOUR_PASSWORD_EMAIL_APP]

FRONTEND_URL = http://localhost:3000/
CLOUDINARY_URL= [YOUR_CLOUDINARY_URL]
```

## Run Locally

Clone the project

```bash
  git clone https://github.com/syahrulakbar/senshi-matsuri-backend
```

Go to the project directory

```bash
  cd senshi-matsuri-backend
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```

## API Documentation

```bash
  http://localhost:5000/api-docs
```

## Features

- Multirole User
- Verification Payment
- Send File Ticket to Email

## Tech Stack

- Nextjs
- Nodejs
- Express
- Postgres
- Supabase
