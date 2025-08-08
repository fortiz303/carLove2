const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId && !this.facebookId && !this.appleId;
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // OAuth fields
    googleId: String,
    facebookId: String,
    appleId: String,
    // Profile fields
    avatar: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer-not-to-say"],
    },
    // Addresses
    addresses: [
      {
        type: {
          type: String,
          enum: ["home", "work", "other"],
          default: "home",
        },
        label: {
          type: String,
          required: true,
          maxlength: [50, "Address label cannot be more than 50 characters"],
        },
        street: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        zipCode: {
          type: String,
          required: true,
        },
        country: {
          type: String,
          default: "US",
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // Vehicles
    vehicles: [
      {
        make: {
          type: String,
          required: true,
          trim: true,
        },
        model: {
          type: String,
          required: true,
          trim: true,
        },
        year: {
          type: Number,
          required: true,
          min: 1900,
          max: new Date().getFullYear() + 1,
        },
        color: {
          type: String,
          required: true,
          trim: true,
        },
        type: {
          type: String,
          enum: ["sedan", "suv", "truck", "luxury", "other"],
          required: true,
        },
        licensePlate: {
          type: String,
          trim: true,
        },
        vin: {
          type: String,
          trim: true,
        },
        nickname: {
          type: String,
          trim: true,
          maxlength: [50, "Nickname cannot be more than 50 characters"],
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Preferences
    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
      marketing: {
        type: Boolean,
        default: false,
      },
    },
    // Stripe customer ID
    stripeCustomerId: String,
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ facebookId: 1 });
userSchema.index({ appleId: 1 });

// Virtual for account lock status
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get default address
userSchema.methods.getDefaultAddress = function () {
  return this.addresses.find((addr) => addr.isDefault) || this.addresses[0];
};

// Method to add address
userSchema.methods.addAddress = function (addressData) {
  if (addressData.isDefault) {
    // Remove default from other addresses
    this.addresses.forEach((addr) => (addr.isDefault = false));
  }
  this.addresses.push(addressData);
  return this.save();
};

// Method to update address
userSchema.methods.updateAddress = function (addressId, updateData) {
  const addressIndex = this.addresses.findIndex(
    (addr) => addr._id.toString() === addressId
  );
  if (addressIndex === -1) {
    throw new Error("Address not found");
  }

  if (updateData.isDefault) {
    this.addresses.forEach((addr) => (addr.isDefault = false));
  }

  this.addresses[addressIndex] = {
    ...this.addresses[addressIndex],
    ...updateData,
  };
  return this.save();
};

// Method to delete address
userSchema.methods.deleteAddress = function (addressId) {
  this.addresses = this.addresses.filter(
    (addr) => addr._id.toString() !== addressId
  );
  return this.save();
};

// Vehicle management methods
userSchema.methods.getVehicles = function () {
  return this.vehicles.sort((a, b) => {
    // Default vehicle first, then by creation date
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

userSchema.methods.getDefaultVehicle = function () {
  return this.vehicles.find((vehicle) => vehicle.isDefault) || this.vehicles[0];
};

userSchema.methods.addVehicle = function (vehicleData) {
  if (vehicleData.isDefault) {
    // Remove default from other vehicles
    this.vehicles.forEach((vehicle) => (vehicle.isDefault = false));
  }
  this.vehicles.push(vehicleData);
  return this.save();
};

userSchema.methods.updateVehicle = function (vehicleId, updateData) {
  const vehicleIndex = this.vehicles.findIndex(
    (vehicle) => vehicle._id.toString() === vehicleId
  );
  if (vehicleIndex === -1) {
    throw new Error("Vehicle not found");
  }

  if (updateData.isDefault) {
    this.vehicles.forEach((vehicle) => (vehicle.isDefault = false));
  }

  this.vehicles[vehicleIndex] = {
    ...this.vehicles[vehicleIndex],
    ...updateData,
  };
  return this.save();
};

userSchema.methods.deleteVehicle = function (vehicleId) {
  this.vehicles = this.vehicles.filter(
    (vehicle) => vehicle._id.toString() !== vehicleId
  );
  return this.save();
};

userSchema.methods.setDefaultVehicle = function (vehicleId) {
  this.vehicles.forEach((vehicle) => (vehicle.isDefault = false));
  const vehicle = this.vehicles.find(
    (vehicle) => vehicle._id.toString() === vehicleId
  );
  if (vehicle) {
    vehicle.isDefault = true;
  }
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
