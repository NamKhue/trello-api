// import nodemailer from "nodemailer";
// import { format } from "date-fns";

// const User = require("../models/userModel");

// // Set up the transporter for nodemailer
// const transporter = nodemailer.createTransport({
//   service: "gmail", // or another email service provider
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const sendDeadlineNotification = async (notification) => {
//   const user = await User.findOne({ email: notification.impactResistantId });

//   if (user) {
//     const mailOptions = {
//       from: "no-reply@example.com",
//       to: user.email,
//       subject: "Upcoming Deadline Notification",
//       text: `Hi ${
//         user.name
//       },\n\nThis is a reminder that the deadline for the card ${
//         notification.objectId
//       } is approaching on ${format(
//         notification.happenedAt,
//         "MMMM d, yyyy HH:mm"
//       )}.`,
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.log("Error sending email:", error);
//       } else {
//         console.log("Email sent:", info.response);
//       }
//     });
//   }
// };

// export const emailService = {
//   sendDeadlineNotification,
// };
