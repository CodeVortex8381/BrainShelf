const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, "Please enter a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    semester: {
      type: String,
      trim: true,
      enum: {
        values: [
          "Semester 1",
          "Semester 2",
          "Semester 3",
          "Semester 4",
          "Semester 5",
          "Semester 6",
          "Semester 7",
          "Semester 8",
          "Other",
          "",
        ],
        message: "{VALUE} is not a supported semester",
      },
      default: "",
    },
    college: {
      type: String,
      trim: true,
      maxlength: [150, "College name cannot exceed 150 characters"],
      default: "",
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Never expose passwordHash in toJSON
UserSchema.methods.toJSON = function () {
  const userObj = this.toObject();
  delete userObj.passwordHash;
  delete userObj.__v;
  return userObj;
};

// Password comparison helper
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash passwords
UserSchema.statics.hashPassword = async function (plaintextPassword) {
  if (!plaintextPassword || plaintextPassword.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plaintextPassword, salt);
};

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
