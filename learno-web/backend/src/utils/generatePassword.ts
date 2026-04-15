import crypto from "crypto";

/**
 * Generate a secure random password with configurable length.
 * Ensures at least one uppercase, one lowercase, one number, and one special character.
 */
export const generatePassword = (length = 12): string => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%&*";
  const all = uppercase + lowercase + numbers + special;

  // Ensure at least one of each required character type
  let password =
    uppercase[crypto.randomInt(uppercase.length)] +
    lowercase[crypto.randomInt(lowercase.length)] +
    numbers[crypto.randomInt(numbers.length)] +
    special[crypto.randomInt(special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[crypto.randomInt(all.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => crypto.randomInt(3) - 1)
    .join("");
};
