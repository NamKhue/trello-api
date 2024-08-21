// import emailService from "~/services/emailService";

// const sendTestEmail = async (req, res) => {
//   try {
//     await emailService.sendDeadlineNotification({
//       impactResistantId: req.body.email,
//       objectId: "testCardId",
//       happenedAt: Date.now(),
//       notifyBefore: 10, // Notify 10 minutes before
//       type: "DEADLINE",
//     });
//     res.status(200).json({ message: "Test email sent!" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// module.exports = {
//   sendTestEmail,
// };
