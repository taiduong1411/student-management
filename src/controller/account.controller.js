const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const Account = require("../model/account");

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = await scryptAsync(password, salt, 64);
  return key === derived.toString("hex");
}

function createToken(account) {
  const payload = {
    sub: account._id.toString(),
    role: account.role,
  };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: "6h" };
  return jwt.sign(payload, secret, options);
}

function publicAccount(account) {
  return {
    id: account._id,
    email: account.email,
    role: account.role,
    status: account.status,
    displayName: account.displayName,
    studentId: account.studentId,
    lastLoginAt: account.lastLoginAt,
    createdAt: account.createdAt,
  };
}

const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const exists = await Account.findOne({
      email,
    });
    if (exists) {
      return res.status(409).json({ message: "Account already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const account = await Account.create({
      email,
      password: hashedPassword,
      displayName,
      status: "active",
    });

    const token = createToken(account);
    return res.status(201).json({
      token,
      account: publicAccount(account),
    });
  } catch (error) {
    console.error("account register error", error);
    return res.status(500).json({ message: "Unable to create account" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const account = await Account.findOne({ email });
    if (!account) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const matched = await verifyPassword(password, account.password);
    if (!matched) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    account.lastLoginAt = new Date();
    await account.save();

    const token = createToken(account);
    return res.status(200).json({
      token,
      account: publicAccount(account),
    });
  } catch (error) {
    console.error("account login error", error);
    return res.status(500).json({ message: "Unable to authenticate" });
  }
};

// Logout (với JWT stateless, logout chỉ cần xóa token ở client)
// Endpoint này chỉ để xác nhận logout thành công
const logout = async (req, res) => {
  try {
    // Với JWT stateless, logout thực tế chỉ cần client xóa token
    // Có thể thêm blacklist token nếu cần, nhưng đơn giản thì chỉ cần trả về success
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("logout error", error);
    return res.status(500).json({ message: "Unable to logout" });
  }
};

module.exports = {
  register,
  login,
  logout,
};
