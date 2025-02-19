const { text } = require('express');
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    (this.to = user.email),
      (this.firstname = user.name.split(' ')[0]),
      (this.url = url),
      (this.from = `kareem tarek <${process.env.EMAIL_FROM}>`);
  }

  // create transporter
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.Gmail_USER,
          pass: process.env.GMAIL_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // send email
  async send(template, subject) {
    // convert pug template into html
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstname: this.firstname,
      url: this.url,
      subject,
    });
    // create email options
    const mailOptions = {
      to: this.to,
      from: this.from,
      subject,
      html,
      text: htmlToText.convert(html),
    };
    // send email
    await this.newTransport().sendMail(mailOptions);
  }

  // create send welcome
  async sendWelcome() {
    await this.send('welcome', 'welcome to natours family');
  }

  // create send reset password
  async sendResetPassword() {
    await this.send(
      'resetPassword',
      'password reset token (valid for 10 minutes)',
    );
  }
};
