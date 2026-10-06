import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const host = process.env.SMTP_HOST as string;
const port = Number(process.env.SMTP_PORT);
const user = process.env.SMTP_USER as string;
const pass = process.env.SMTP_PASS as string;
const from = process.env.EMAIL_FROM as string;

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!host || !pass || !port || !user) {
    throw new Error("Missing email env variables");
  }
  try {
    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            pass,
            user
        }
    });

    await transporter.sendMail({
        from,
        to,
        subject,
        html
    });

    console.log('Email sent successfully')
  } catch (error) {
    console.log("Error sending email", error);
    throw error;
  }
}

export default sendEmail;
