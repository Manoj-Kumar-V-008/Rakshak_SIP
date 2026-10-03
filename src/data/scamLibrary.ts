// Scam knowledge library. Labels mirror backend/app/pipeline/rules.py TYPE_DETAILS
// so the Learn tab always agrees with what the scanner reports.

export interface ScamEntry {
  id: string;
  title: string;
  howItWorks: string;
  redFlags: string[];
  tips: string[];
  sample: string;
}

export const SCAM_LIBRARY: ScamEntry[] = [
  {
    id: 'digital_arrest',
    title: 'Digital Arrest Scam',
    howItWorks: 'Callers posing as CBI or police claim a parcel in your name holds drugs or laundered money, declare you under arrest, and keep you on a video call while demanding verification payments.',
    redFlags: ['Claims to be CBI, police, or customs', 'Says digital arrest over video call', 'Orders secrecy: do not tell anyone', 'Demands an urgent transfer for verification'],
    tips: ['Disconnect. Real police never investigate over video calls.', 'Never transfer money to verify yourself.', 'Call 1930 to report the attempt.'],
    sample: 'This is Inspector Rao from CBI. A parcel in your name contains narcotics. You are under digital arrest. Stay on the video call, do not tell anyone, transfer Rs 50,000 for verification.',
  },
  {
    id: 'credential_phishing',
    title: 'Credential / KYC Phishing',
    howItWorks: 'Messages warning that your bank account or KYC will be blocked push you to fake login pages that steal OTPs, PINs, and passwords.',
    redFlags: ['Urgent KYC or account-blocked threat', 'Link that looks like your bank but is not', 'Asks for OTP, PIN, CVV, or password'],
    tips: ['Do not share OTP, PIN, CVV, or passwords.', 'Open the official app or site yourself instead of tapping links.', 'Call 1930 if you already entered details.'],
    sample: 'Dear customer, your SBI account closes today. Update KYC now: http://sbi-kyc-update.xyz/login',
  },
  {
    id: 'utility_disconnection',
    title: 'Utility Disconnection Fraud',
    howItWorks: 'Fake electricity-board alerts threaten disconnection tonight and give an officer number that harvests personal and payment details.',
    redFlags: ['Disconnection threatened for tonight', 'Unknown officer callback number', 'Artificial urgency and 24-hour deadlines'],
    tips: ['Do not call the number in the message.', 'Check bills only in the utility official app or site.', 'Call 1930 to report the number.'],
    sample: 'ALERT: your electricity power connection will be disconnected tonight at 9.30 PM. Call power officer at 9812345678 immediately.',
  },
  {
    id: 'lottery_prize',
    title: 'Lottery / Prize Scam',
    howItWorks: 'Congratulations messages about KBC or lucky draws ask for a processing fee or personal details to release a prize that does not exist.',
    redFlags: ['Prize you never entered', 'Fee or tax demanded to claim', 'Manager contact on a personal number'],
    tips: ['Do not pay any fee to claim a prize.', 'Block and report the sender.', 'Call 1930 if you already paid.'],
    sample: 'CONGRATULATIONS! You won 25,00,000 INR in KBC Lucky Draw. Contact manager Mr. Kumar at 9999123456 to claim.',
  },
  {
    id: 'fake_job',
    title: 'Fake Job / Task Scam',
    howItWorks: 'Part-time offers pay per like or review, then demand deposits or move you to Telegram groups that siphon money.',
    redFlags: ['Earnings with no interview or skill check', 'Tasks on YouTube or Telegram', 'Deposit asked before work starts'],
    tips: ['Do not pay deposits for online tasks or jobs.', 'Verify employers through official channels.', 'Call 1930 if money was taken.'],
    sample: 'Part time job! Earn Rs 5000 daily by liking YouTube videos. Join our Telegram group.',
  },
  {
    id: 'investment_fraud',
    title: 'Investment Fraud',
    howItWorks: 'VIP trading groups promise guaranteed multi-fold returns and pressure quick UPI deposits into personal accounts.',
    redFlags: ['Guaranteed returns promised', 'Limited seats and countdown pressure', 'Deposits to personal UPI IDs'],
    tips: ['Do not transfer money for guaranteed returns.', 'Check adviser registration before investing.', 'Call 1930 if you already transferred.'],
    sample: 'Join our VIP stock group — guaranteed 300% returns in 30 days, limited seats, UPI deposit required.',
  },
  {
    id: 'loan_harassment',
    title: 'Instant-Loan Harassment',
    howItWorks: 'Fraud loan apps invent overdue dues, then threaten to message your contacts unless you pay immediately.',
    redFlags: ['Loan you never took or already closed', 'Threats to contact your family or friends', 'Payment demanded to unknown UPI IDs'],
    tips: ['Do not pay unknown contacts under pressure.', 'Contact your lender through official support.', 'Call 1930 and save the threats as evidence.'],
    sample: 'Your instant loan is overdue. Pay now or we will message all your contacts about your default.',
  },
  {
    id: 'malicious_app_or_hijack',
    title: 'Malicious APK / Call Hijack',
    howItWorks: 'Reward links install APK files that steal OTPs, or dial codes like *401* forward your calls to criminals.',
    redFlags: ['Link ending in .apk outside the Play Store', 'Dial codes starting with *401* or **21*', 'Rewards that need an install'],
    tips: ['Do not install the app or dial the code.', 'Uninstall unknown APKs and change bank passwords.', 'Call your telecom provider if calls behave oddly.'],
    sample: 'Your SBI rewards expire today! Install the app: http://bit.ly/sbi-rewards.apk',
  },
  {
    id: 'suspicious_link',
    title: 'Suspicious Shortened Link',
    howItWorks: 'Bare shortened links hide the real destination, which often hosts phishing pages or malware.',
    redFlags: ['Shortened URL with no context', 'Sender you cannot verify', 'Urgency to open immediately'],
    tips: ['Do not open or forward unfamiliar shortened links.', 'Verify the sender through another channel.', 'Paste it in the Scanner before touching it.'],
    sample: 'Hi, can you check this link http://tinyurl.com/x9s2 ?',
  },
];
