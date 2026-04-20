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

const orderSchema = new mongoose.Schema({
  customerName: String, phone: String, email: String,
  deliveryAddress: String, addressPincode: String, addressInstructions: String,
  orderType: String,
  items: [{ name: String, price: Number, quantity: Number, _subtotal: Number, option: String }],
  total: Number, status: { type: String, default: "pending" },
  stripeSessionId: String, createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

mongoose.connect(MONGODB_URL).then(async () => {
  // 1. Create a test order
  const order = await Order.create({
    customerName: "Test Client",
    phone: "0600000000",
    email: "test@example.com",
    deliveryAddress: "1 Rue du Test, Paris",
    addressPincode: "75001",
    addressInstructions: "",
    orderType: "livraison",
    items: [{ name: "Butter Chicken", price: 13.50, quantity: 2, _subtotal: 27.00, option: "" }],
    total: 28.50,
    status: "pending",
    stripeSessionId: "cs_test_manual",
  });
  console.log("Order created:", order.customerName, "—", order.total + " €");

  // 2. Send push notification
  const subs = await PushSubscription.find().lean();
  console.log(`Found ${subs.length} subscription(s)`);

  if (subs.length === 0) {
    console.log("No subscriptions — click 'Activer les notifications' on /dashboard/orders first.");
    await mongoose.disconnect();
    return;
  }

  const payload = JSON.stringify({
    title: "Nouvelle commande !",
    body: `Test Client — 28.50 €`,
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
