// const nodemailer = require('nodemailer');

// // Configure the email transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail', // Use Gmail as the email service
//   auth: {
//     user: process.env.EMAIL_USER, // Your Gmail email address
//     pass: process.env.EMAIL_PASS, // Your Gmail App Password
//   },
//   tls: {
//     rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true, // Disable strict certificate check in development
//   },
// });

// // Function to send an email
// const sendEmail = async ({ to, subject, text, html }) => {
//   console.log('Loading sendEmail from:', __filename); // Verify the file being loaded
//   try {
//     const mailOptions = {
//       from: `"Plateforme Médicale" <${process.env.EMAIL_USER}>`, // Sender address
//       to, // Recipient email
//       subject, // Subject line
//       text, // Plain text body
//       html, // HTML body (optional)
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log('Email sent successfully:', info.messageId);
//     return info;
//   } catch (error) {
//     console.error('Error sending email:', error);
//     throw new Error('Failed to send email');
//   }
// };

// module.exports = sendEmail;
const nodemailer = require('nodemailer');

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail as the email service
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail email address
    pass: process.env.EMAIL_PASS, // Your Gmail App Password
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true, // Disable strict certificate check in development
  },
});

// Function to create a professional email template
const getEmailTemplate = (content, recipientName = 'Utilisateur') => {
  // Remplacez cette URL par l'URL publique de votre logo sur Cloudinary ou un autre service
  const LOGO_URL = 'https://res.cloudinary.com/dquvfn3xn/image/upload/v1753544602/SmallSquareLogoJpg-removebg-preview_fc8g48.png';
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rdv-Med - Notification</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background-color: #f5f7fa;
          color: #333;
        }
        .container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(45deg, #0a66c2, #094c99);
          padding: 20px;
          text-align: center;
        }
        .header img {
          max-width: 100px;
          height: auto;
        }
        .content {
          padding: 30px;
          text-align: center;
        }
        .content h2 {
          color: #0a66c2;
          margin-bottom: 20px;
        }
        .content p {
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .cta-button {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(45deg, #0a66c2, #094c99);
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          background-color: #e9ecef;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .footer p {
          margin: 5px 0;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 95%;
          }
          .content {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="Logo Rdv-Med">
        </div>
        <div class="content">
         
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rdv-Med. Tous droits réservés.</p>
          <p>Plateforme de prise de rendez-vous médicaux</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to send an email
const sendEmail = async ({ to, subject, text, html, recipientName }) => {
  console.log('Loading sendEmail from:', __filename); // Verify the file being loaded
  try {
    // If HTML content is provided, wrap it in the template; otherwise, convert text to HTML
    const formattedHtml = html ? getEmailTemplate(html, recipientName) : getEmailTemplate(text.replace(/\n/g, '<br>'), recipientName);

    const mailOptions = {
      from: `"Rdv-Med" <${process.env.EMAIL_USER}>`, // Sender address with your platform name
      to, // Recipient email
      subject: `[Rdv-Med] ${subject}`, // Prepend platform name to subject
      text, // Plain text body
      html: formattedHtml, // Use the formatted HTML with template
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;