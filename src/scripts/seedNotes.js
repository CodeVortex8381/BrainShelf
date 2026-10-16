require("dotenv").config();
const mongoose = require("mongoose");
const { Note } = require("../models/Note");
const User = require("../models/User");
const { connectDB } = require("../config/db");

async function seed() {
  await connectDB();

  let admin = await User.findOne({ role: "admin" });
  if (!admin) {
    admin = await User.findOne();
  }

  const existingCount = await Note.countDocuments();
  if (existingCount > 0) {
    console.log(`ℹ️ Notes collection already has ${existingCount} items. Skipping initial seeding.`);
    await mongoose.disconnect();
    return;
  }

  const seedNotes = [
    {
      title: "Introduction to Java",
      subject: "Core Java & OOP",
      category: "Programming",
      semester: "Semester 1",
      description: "Learn Java basics, variables, data types, control statements, loops, and OOP concepts.",
      tags: ["java", "oop", "basics"],
      status: "approved",
      uploader: admin._id,
      storageProvider: "local_fallback",
      storagePublicId: "intro_to_java.pdf",
      secureUrl: "/uploads/intro_to_java.pdf",
      fileSizeBytes: 2048576,
      originalFileName: "Introduction_to_Java.pdf",
    },
    {
      title: "Database Management Systems",
      subject: "DBMS & SQL",
      category: "Database",
      semester: "Semester 2",
      description: "Understand DBMS concepts, ER diagrams, relational models, SQL queries, and normalization.",
      tags: ["dbms", "sql", "normalization"],
      status: "approved",
      uploader: admin._id,
      storageProvider: "local_fallback",
      storagePublicId: "dbms_guide.pdf",
      secureUrl: "/uploads/dbms_guide.pdf",
      fileSizeBytes: 3145728,
      originalFileName: "Database_Management_Systems.pdf",
    },
    {
      title: "Fundamentals of Artificial Intelligence",
      subject: "Artificial Intelligence",
      category: "AI",
      semester: "Semester 3",
      description: "Explore AI fundamentals, intelligent agents, heuristics, A* search, and game playing algorithms.",
      tags: ["ai", "agents", "heuristics"],
      status: "approved",
      uploader: admin._id,
      storageProvider: "local_fallback",
      storagePublicId: "fundamentals_ai.pdf",
      secureUrl: "/uploads/fundamentals_ai.pdf",
      fileSizeBytes: 4194304,
      originalFileName: "Fundamentals_of_AI.pdf",
    },
    {
      title: "HTML & CSS Complete Study Guide",
      subject: "Frontend Web Development",
      category: "Web Development",
      semester: "Semester 1",
      description: "Learn modern webpage structure, semantic HTML5, Flexbox, CSS Grid, and responsive layout techniques.",
      tags: ["html", "css", "web"],
      status: "approved",
      uploader: admin._id,
      storageProvider: "local_fallback",
      storagePublicId: "html_css_guide.pdf",
      secureUrl: "/uploads/html_css_guide.pdf",
      fileSizeBytes: 1572864,
      originalFileName: "HTML_and_CSS_Guide.pdf",
    },
    {
      title: "Object-Oriented Programming in C++",
      subject: "OOP Concepts",
      category: "Programming",
      semester: "Semester 2",
      description: "Understand classes, objects, inheritance, polymorphism, encapsulation, virtual functions, and memory management.",
      tags: ["cpp", "oop", "polymorphism"],
      status: "approved",
      uploader: admin._id,
      storageProvider: "local_fallback",
      storagePublicId: "oop_cpp.pdf",
      secureUrl: "/uploads/oop_cpp.pdf",
      fileSizeBytes: 2621440,
      originalFileName: "OOP_in_CPP.pdf",
    },
    {
      title: "SQL Query Practice & Advanced Joins",
      subject: "Database Systems",
      category: "Database",
      semester: "Semester 3",
      description: "Hands-on practice with complex SELECT, INNER/OUTER JOINs, GROUP BY, HAVING, subqueries, and views.",
      tags: ["sql", "queries", "joins"],
      status: "approved",
      uploader: admin._id,
      storageProvider: "local_fallback",
      storagePublicId: "sql_queries.pdf",
      secureUrl: "/uploads/sql_queries.pdf",
      fileSizeBytes: 1887436,
      originalFileName: "SQL_Query_Practice.pdf",
    },
  ];

  await Note.insertMany(seedNotes);
  console.log(`✅ Seeded ${seedNotes.length} approved notes into MongoDB Atlas!`);
  await mongoose.disconnect();
}

if (require.main === module) {
  seed();
}

module.exports = seed;
