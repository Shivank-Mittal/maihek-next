// Run with: node tests/send-test-push.js
const mongoose = require("mongoose");
const webpush = require("web-push");

const MONGODB_URL = process.env.MONGODB_URL ||
  "mongodb+srv://asharma89505:hFA7HN87YGSo0vfc@Maihak.zyudebj.mongodb.net/maihak?retryWrites=true&w=majority&appName=Maihak";

webpush.setVapidDetails(
  "mailto:mittal.shivank@gmail.com",
  "BJPGQ52zIPFLgddBXW2apV55TjMvakT2vraAlZXw6XU_yx1Eixwa4VSexWM8C9rLycKOD-lawePPblxiYpiMynE",
  "AKw-a6FaOITJcM-LhthbuPLkBi0XQUziQC9-SIskuJI"
);

const subSchema = new mongoose.Schema({
  endpoint: String,
  keys: { p256dh: String, auth: String },
});
const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model("PushSubscription", subSchema);

mongoose.connect(MONGODB_URL).then(async () => {
  const subs = await PushSubscription.find().lean();
  console.log(`Found ${subs.length} subscription(s)`);

  if (subs.length === 0) {
    console.log("No subscriptions — click 'Activer les notifications' on /dashboard/orders first.");
    await mongoose.disconnect();
    return;
  }

  const payload = JSON.stringify({
    title: "Nouvelle commande !",
    body: "Test Client — 28.50 €",
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
    )
  );

  results.forEach((r, i) =>
    console.log(`Sub ${i}: ${r.status}${r.reason ? " — " + r.reason.message : ""}`)
  );

  await mongoose.disconnect();
});
