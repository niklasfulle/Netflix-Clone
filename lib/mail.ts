import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `http://localhost:3000/auth/new-verification?token=${token}`

  const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PW,
    },
    secure: true,
  });

  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to: email,
    subject: "Confirm your email",
    text: `Click ${confirmLink} to confirm email.`,
    html: `<p>Click <a href="${confirmLink}">here</a> to confirm email.</p>`,
  };

  transporter.sendMail(mailOptions, function (error: any) {
    if (error) {
      throw new Error(error);
    } else {
      return true;
    }
  });
}

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const confirmLink = `http://localhost:3000/auth/new-password?token=${token}`

  const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PW,
    },
    secure: true,
  });

  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to: email,
    subject: "Reset your password",
    text: `Click ${confirmLink} to reset your password.`,
    html: `<p>Click <a href="${confirmLink}">here</a> to reset your password.</p>`,
  };

  transporter.sendMail(mailOptions, function (error: any) {
    if (error) {
      throw new Error(error);
    } else {
      return true;
    }
  });
}

export const sendTwoFactorEmail = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PW,
    },
    secure: true,
  });

  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to: email,
    subject: "2FA Code",
    text: `Your 2FA code: ${token}`,
    html: `<p>Your 2FA code: ${token}</p>`
  };

  transporter.sendMail(mailOptions, function (error: any) {
    if (error) {
      throw new Error(error);
    } else {
      return true;
    }
  });
}