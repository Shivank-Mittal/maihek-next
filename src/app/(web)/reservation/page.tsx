"use client";

import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, Calendar, Clock, Users, MessageSquare } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

const translations = {
  fr: {
    title: "Réservez Votre Table",
    subtitle: "Planifiez votre expérience culinaire avec nous.",
    name: "Nom Complet",
    namePlaceholder: "Entrez votre nom",
    nameRequired: "Le nom est requis",
    nameMinLength: "Le nom doit avoir au moins 2 caractères",
    email: "Adresse E-mail",
    emailPlaceholder: "exemple@domaine.com",
    emailRequired: "L’e-mail est requis",
    emailInvalid: "Entrez un e-mail valide",
    phone: "Numéro de Téléphone",
    phonePlaceholder: "1234567890",
    phoneRequired: "Le numéro est requis",
    phoneInvalid: "Entrez un numéro valide à 10 chiffres",
    date: "Date",
    dateRequired: "La date est requise",
    time: "Heure",
    timeRequired: "L’heure est requise",
    timePlaceholder: "Sélectionnez une heure",
    partySize: "Nombre de Personnes",
    guestsRequired: "Le nombre de personnes est requis",
    guestsInvalid: "Entrez un nombre entre 1 et 100",
    specialRequests: "Demandes Spéciales",
    specialRequestsPlaceholder: "Ex. : table près de la fenêtre, allergies alimentaires",
    submit: "Réserver Maintenant",
    processing: "Traitement...",
    modalTitle: "Réservation Confirmée",
    modalMessage:
      "Merci pour votre réservation ! Nous vous avons envoyé une confirmation par e-mail.",
    modalClose: "Fermer",
    toastSuccess: "Réservation réussie !",
    toastError: "Erreur lors de la réservation. Veuillez réessayer.",
    languageToggle: "English",
    languageToggleTooltip: "Switch to English",
    unavailable: "(Indisponible)",
  },
};

interface ReservationFormData {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function ReservationForm() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isReservationOpen, setIsReservationOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReservationFormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      partySize: 1,
      specialRequests: "",
    },
  });

  const selectedDate = watch("date");

  useEffect(() => {
    const fetchReservationStatus = async () => {
      try {
        const res = await fetch("/api/v1/reservation-status");
        if (!res.ok) {
          throw new Error("Failed to fetch reservation status");
        }
        const data: { status: "paused" | "resumed" } = await res.json();
        setIsReservationOpen(data.status === "resumed");
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setIsReservationOpen(false);
        setIsLoading(false);
      }
    };
    fetchReservationStatus();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const mockTimeSlots: TimeSlot[] = [
        { time: "11:00 - 11:30", available: true },
        { time: "11:30 - 12:00", available: true },
        { time: "12:00 - 12:30", available: true },
        { time: "12:30 - 13:00", available: true },
        { time: "13:00 - 13:30", available: true },
        { time: "13:30 - 14:00", available: true },
        { time: "14:00 - 14:30", available: true },
        { time: "18:00 - 18:30", available: true },
        { time: "18:30 - 19:00", available: true },
        { time: "19:00 - 19:30", available: true },
        { time: "19:30 - 20:00", available: true },
        { time: "20:00 - 20:30", available: true },
        { time: "20:30 - 21:00", available: true },
        { time: "21:00 - 21:30", available: true },
        { time: "21:30 - 22:00", available: true },
        { time: "22:00 - 22:30", available: true },
        { time: "22:30 - 23:00", available: true },
      ];
      setTimeSlots(mockTimeSlots);
    } else {
      setTimeSlots([]);
      setValue("time", "");
    }
  }, [selectedDate, setValue]);

  const t = translations["fr"];

  const onSubmit: SubmitHandler<ReservationFormData> = async (data) => {
    if (data.partySize < 1 || data.partySize > 100) {
      toast.error(t.guestsInvalid, {
        duration: 3000,
        style: { background: "#fff", color: "#000", border: "1px solid #ccc" },
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Échec de la réservation");

      toast.success(t.toastSuccess, {
        duration: 3000,
        style: { background: "#1a1a1a", color: "#fff", border: "1px solid #333" },
      });
      setShowModal(true);
      reset();
    } catch (error: any) {
      toast.error(t.toastError, {
        duration: 3000,
        style: { background: "#fff", color: "#000", border: "1px solid #ccc" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="animate-spin h-10 w-10 text-indigo-600"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <svg
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </motion.div>
      </div>
    );
  }

  if (!isReservationOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative w-full max-w-md bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-lg border border-gray-100 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1
            className="text-3xl font-bold text-gray-900 mb-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Réservations Temporairement Suspendues"
          </motion.h1>
          <p className="text-gray-600 text-base leading-relaxed mb-4">
            En raison d’une demande exceptionnelle, notre système de réservation est temporairement
            suspendu pour garantir une expérience culinaire optimale.
          </p>
          <p className="text-gray-500 text-sm">
            Veuillez revenir bientôt pour réserver votre table. Merci de votre compréhension.
          </p>
          <motion.a
            href="/"
            className="mt-8 inline-block px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Retour à la Page d’Accueil
          </motion.a>
        </motion.div>
      </div>
    );
  }

  return (
    <section className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
            {t.title}
          </h2>
          <p className="text-center text-gray-600 mb-10 text-lg">{t.subtitle}</p>
        </motion.div>

        <motion.div
          className="bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.name}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  {...register("name", {
                    required: t.nameRequired,
                    minLength: { value: 2, message: t.nameMinLength },
                  })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition-all duration-200"
                  placeholder={t.namePlaceholder}
                  aria-invalid={errors.name ? "true" : "false"}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
              </div>
            </div>

            <div className="relative">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  {...register("email", {
                    required: t.emailRequired,
                    pattern: { value: /\S+@\S+\.\S+/, message: t.emailInvalid },
                  })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition-all duration-200"
                  placeholder={t.emailPlaceholder}
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="relative">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.phone}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  {...register("phone", {
                    required: t.phoneRequired,
                    pattern: { value: /^[0-9]{10}$/, message: t.phoneInvalid },
                  })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition-all duration-200"
                  placeholder={t.phonePlaceholder}
                  aria-invalid={errors.phone ? "true" : "false"}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="relative">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.date}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  id="date"
                  {...register("date", { required: t.dateRequired })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition-all duration-200"
                  min={new Date().toISOString().split("T")[0]}
                  aria-invalid={errors.date ? "true" : "false"}
                />
                {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>}
              </div>
            </div>

            <div className="relative">
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.time}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="time"
                  {...register("time", { required: t.timeRequired })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition-all duration-200 appearance-none"
                  disabled={!selectedDate}
                  aria-invalid={errors.time ? "true" : "false"}
                >
                  <option value="">{t.timePlaceholder}</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.time} value={slot.time} disabled={!slot.available}>
                      {slot.time} {slot.available ? "" : t.unavailable}
                    </option>
                  ))}
                </select>
                {errors.time && <p className="mt-1 text-sm text-red-500">{errors.time.message}</p>}
              </div>
            </div>

            <div className="relative">
              <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.partySize}
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="guests"
                  {...register("partySize", {
                    required: t.guestsRequired,
                    min: { value: 1, message: t.guestsInvalid },
                    max: { value: 100, message: t.guestsInvalid },
                  })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition-all duration-200 appearance-none"
                  aria-invalid={errors.partySize ? "true" : "false"}
                >
                  {[...Array(100)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i + 1 === 1 ? t.partySize.slice(0, -1) : t.partySize}
                    </option>
                  ))}
                </select>
                {errors.partySize && (
                  <p className="mt-1 text-sm text-red-500">{errors.partySize.message}</p>
                )}
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="specialRequests"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t.specialRequests}
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                <textarea
                  id="specialRequests"
                  {...register("specialRequests")}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition-all duration-200"
                  placeholder={t.specialRequestsPlaceholder}
                  rows={4}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
              whileHover={{ scale: isSubmitting ? 1 : 1.03 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t.processing}
                </>
              ) : (
                t.submit
              )}
            </motion.button>
          </form>
        </motion.div>

        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-lg max-w-md w-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.modalTitle}</h3>
                <p className="text-gray-700 mb-6">{t.modalMessage}</p>
                <motion.button
                  onClick={closeModal}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {t.modalClose}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
