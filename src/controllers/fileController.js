import path from "path";
import fs from "fs";

import File from "~/models/fileModel";

const uploadFiles = async (req, res) => {
  const files = req.files;
  const cardId = req.params.id;

  if (!cardId) {
    return res.status(400).json({ message: "Card ID is required" });
  }

  try {
    // const fileRecords = files.map((file) => ({
    //   filename: file.filename,
    //   originalname: file.originalname,
    //   mimetype: file.mimetype,
    //   size: file.size,
    //   cardId,
    // }));

    const fileRecords = [];
    for (const [key, base64Data] of Object.entries(files)) {
      const base64DataCleaned = base64Data.replace(/^data:.*;base64,/, "");
      const buffer = Buffer.from(base64DataCleaned, "base64");

      const filename = `${Date.now()}-${key}`;
      const filePath = path.join(__dirname, "../public/upload_files", filename);

      // Save the file
      fs.writeFileSync(filePath, buffer);

      fileRecords.push({
        filename,
        originalname: key,
        mimetype: "application/octet-stream",
        size: buffer.length,
        cardId,
      });
    }

    await File.insertMany(fileRecords);
    res
      .status(200)
      .json({ message: "Files uploaded successfully!", files: fileRecords });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Files upload failed", error: err.message });
  }
};

const getFiles = async (req, res) => {
  const cardId = req.params.id;

  if (!cardId) {
    return res.status(400).json({ message: "Card ID is required" });
  }

  try {
    const files = await File.find({ cardId });
    res.status(200).json(files);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch files", error: err.message });
  }
};

const deleteFile = async (req, res) => {
  const cardId = req.params.id;
  const { filename } = req.body;

  if (!filename || !cardId) {
    return res
      .status(400)
      .json({ message: "Filename and Card ID are required" });
  }

  try {
    await File.deleteOne({ filename, cardId });

    // Optionally delete the file from disk
    fs.unlinkSync(path.join(__dirname, "../public/upload_files", filename));
    // fs.unlinkSync(path.join(__dirname, "src/upload_files", filename));

    res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete file", error: err.message });
  }
};

export const fileController = {
  uploadFiles,
  getFiles,
  deleteFile,
};
