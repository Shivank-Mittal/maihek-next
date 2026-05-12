import mongoose, { Schema, Document, Model } from "mongoose";

interface IReservationStatus extends Document {
  status: "paused" | "resumed";
  updatedAt: Date;
}

interface ReservationStatusModel extends Model<IReservationStatus> {
  getStatus(): Promise<IReservationStatus>;
}

const ReservationStatusSchema: Schema = new Schema<IReservationStatus>({
  status: {
    type: String,
    enum: ["paused", "resumed"],
    required: true,
    default: "resumed",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ReservationStatusSchema.statics.getStatus = async function () {
  let status = await this.findOne({}).select("status");
  if (!status) {
    status = await this.create({ status: "resumed" });
    return { status: status.status };
  }
  return status;
};

const ReservationStatus: ReservationStatusModel =
  (mongoose.models.ReservationStatus as ReservationStatusModel) ||
  mongoose.model<IReservationStatus, ReservationStatusModel>(
    "ReservationStatus",
    ReservationStatusSchema
  );

export default ReservationStatus;
