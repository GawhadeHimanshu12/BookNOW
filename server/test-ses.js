require('dotenv').config();
const { SESClient, GetIdentityVerificationAttributesCommand } = require('@aws-sdk/client-ses');

const ses = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

async function checkEmail() {
    const emailToCheck = process.env.EMAIL_FROM_ADDRESS.trim(); // Trim removes accidental spaces
    console.log(`Checking AWS verification status for: [${emailToCheck}]...`);
    
    try {
        const command = new GetIdentityVerificationAttributesCommand({ Identities: [emailToCheck] });
        const data = await ses.send(command);
        
        const status = data.VerificationAttributes[emailToCheck]?.VerificationStatus || "NOT VERIFIED OR WRONG ACCOUNT/REGION";
        console.log(`\nAWS STATUS: ---> ${status} <---`);
        
        if (status === 'Success') {
            console.log("\n✅ Good news! AWS sees it as verified. The issue is likely the 'To' (recipient) email you are typing in the frontend.");
        } else {
            console.log("\n❌ AWS says it is NOT verified using these Access Keys. You either have the wrong keys, wrong region in .env, or an invisible space.");
        }
    } catch (error) {
        console.error("AWS Error:", error.message);
    }
}

checkEmail();