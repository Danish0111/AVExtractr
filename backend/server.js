import express from 'express';
import cors from 'cors';
import extractionRoute from './routes/extraction.route.js';
import path from "path";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;

app.use("/api", extractionRoute);

if(process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("/*splat", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
