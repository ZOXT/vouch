import { Resend } from "resend";
import { env } from "../config/env";

const resend = new Resend(env.RESEND_API_KEY);


export const sendOTPEmail = async (
  email: string,
  name: string,
  otp: string
) => {

  await resend.emails.send({

    from: env.FROM_EMAIL,

    to: email,

    subject: "Verify your Vouch account",

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 500px;
        margin:auto;
        padding:20px;
      ">

        <h2>
          Welcome to Vouch, ${name}
        </h2>

        <p>
          Use this verification code to complete your signup:
        </p>


        <div style="
          font-size:36px;
          font-weight:bold;
          letter-spacing:8px;
          text-align:center;
          background:#f4f4f4;
          padding:20px;
          border-radius:10px;
        ">
          ${otp}
        </div>


        <p>
          This code expires in 10 minutes.
        </p>


      </div>
    `

  });

};