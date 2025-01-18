const brevo = require('sib-api-v3-sdk');

function otp(username,email,otp) {

let defaultClient = brevo.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.brevo;

let apiInstance = new brevo.TransactionalEmailsApi();
let sendSmtpEmail = new brevo.SendSmtpEmail();

sendSmtpEmail.subject = "OTP";
sendSmtpEmail.htmlContent = `
<html>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 400px; margin: 50px auto; background: #ffffff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); padding: 20px; text-align: center;">
    <h1 style="color:rgb(56, 59, 245); font-size: 24px; margin-bottom: 10px;">One Time Passcode</h1>
    <h4 style="font-size: 16px; color: #555; margin-bottom: 20px;">Use this code and do not share it with anyone.</h4>
    <h1 style="font-size: 32px; color: #333; background: #f9f9f9; border: 1px dashed #ddd; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</h1>
  </div>
</body>
</html>`;

sendSmtpEmail.sender = { "name": "UNICLUB", "email": "uniclub.afh@gmail.com" };
sendSmtpEmail.to = [
  { "email": email, "name": username }
];
sendSmtpEmail.replyTo = { "email": "uniclub.afh@gmail.com", "name": "sample-name" };
sendSmtpEmail.headers = { "Some-Custom-Name": "unique-id-1235" };
sendSmtpEmail.params = { "parameter": "My param value", "subject": "common subject" };


apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
  console.log('API called successfully. Returned data: ' + JSON.stringify(data));
}, function (error) {
  console.error(error);
});
}

module.exports = otp;
