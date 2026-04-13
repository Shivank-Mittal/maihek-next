'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';

// Translation objects
const translations = {
  en: {
    title: 'Get in Touch',
    subtitle: 'We’d love to hear from you. Send us a message!',
    fullName: 'Full Name',
    email: 'Email Address',
    message: 'Your Message',
    namePlaceholder: 'Enter your full name',
    emailPlaceholder: 'Enter your email',
    messagePlaceholder: 'What’s on your mind?',
    submitButton: 'Send Message',
    processing: 'Sending...',
    errorSubmit: 'Failed to send message. Please try again.',
    successMessage: 'Message sent successfully! We’ll get back to you soon.',
    modalTitle: 'Message Sent',
    modalThankYou: (name: string) => `Thank you, ${name}, for your message!`,
    modalMessage: 'Message',
    modalEmailConfirmation: (email: string) => `A confirmation has been sent to ${email}.`,
    closeButton: 'Close',
    languageToggle: 'Translate this site',
    languageToggleTooltip: 'Switch language',
    validation: {
      nameRequired: 'Name is required',
      emailRequired: 'Email is required',
      emailInvalid: 'Invalid email address',
      messageRequired: 'Message is required',
    },
  },
  fr: {
    title: 'Contactez-nous',
    subtitle: 'Nous serions ravis d’avoir de vos nouvelles. Envoyez-nous un message !',
    fullName: 'Nom complet',
    email: 'Adresse e-mail',
    message: 'Votre message',
    namePlaceholder: 'Entrez votre nom complet',
    emailPlaceholder: 'Entrez votre adresse e-mail',
    messagePlaceholder: 'Qu’avez-vous à dire ?',
    submitButton: 'Envoyer le message',
    processing: 'Envoi en cours...',
    errorSubmit: 'Échec de l’envoi du message. Veuillez réessayer.',
    successMessage: 'Message envoyé avec succès ! Nous vous répondrons bientôt.',
    modalTitle: 'Message envoyé',
    modalThankYou: (name: string) => `Merci, ${name}, pour votre message !`,
    modalMessage: 'Message',
    modalEmailConfirmation: (email: string) => `Une confirmation a été envoyée à ${email}.`,
    closeButton: 'Fermer',
    languageToggle: 'Traduisez ce site',
    languageToggleTooltip: 'Changer de langue',
    validation: {
      nameRequired: 'Le nom est requis',
      emailRequired: 'L’adresse e-mail est requise',
      emailInvalid: 'Adresse e-mail non valide',
      messageRequired: 'Le message est requis',
    },
  },
};

interface FormData {
  name: string;
  email: string;
  message: string;
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const [language, setLanguage] = useState<'en' | 'fr'>('fr');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  useEffect(() => {
    const storedLang = localStorage.getItem('language');
    if (storedLang === 'en' || storedLang === 'fr') {
      setLanguage(storedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(translations[language].errorSubmit);
      }
      setSuccessMessage(translations[language].successMessage);
      setSubmittedData(data); // Store submitted data for modal
      setShowModal(true);
      reset();
    } catch (error) {
      setErrorMessage(translations[language].errorSubmit);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSubmittedData(null);
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'fr' : 'en'));
  };

  const t = translations[language];

  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500 rounded-full filter blur-3xl -translate-x-1/3 translate-y-1/4"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-600 rounded-full filter blur-3xl translate-x-1/3 -translate-y-1/4"></div>
      </div>

      <div className="absolute top-0 right-0 mt-4 mr-4 z-20">
        <div className="relative group">
          <button
            onClick={toggleLanguage}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {t.languageToggle}
          </button>
          <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -bottom-8 right-0 transform translate-y-1 z-10">
            {t.languageToggleTooltip}
          </div>
        </div>
      </div>
      <div className="relative">
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h2 className="text-5xl font-extrabold text-center mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
              {t.title}
            </h2>
            <p className="text-center text-gray-300 mb-12 text-lg max-w-md mx-auto">{t.subtitle}</p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8 bg-gray-800/90 backdrop-blur-lg p-10 rounded-2xl shadow-2xl border border-gray-700/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="relative">
                <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                  {t.fullName}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="name"
                    {...register('name', { required: t.validation.nameRequired })}
                    className="w-full pl-10 pr-5 py-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition duration-300"
                    placeholder={t.namePlaceholder}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                  )}
                </div>
              </div>
              <div className="relative">
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    {...register('email', {
                      required: t.validation.emailRequired,
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: t.validation.emailInvalid,
                      },
                    })}
                    className="w-full pl-10 pr-5 py-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition duration-300"
                    placeholder={t.emailPlaceholder}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="relative">
              <label htmlFor="message" className="block text-sm font-medium text-gray-200 mb-2">
                {t.message}
              </label>
              <textarea
                id="message"
                {...register('message', { required: t.validation.messageRequired })}
                rows={4}
                className="w-full px-5 py-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition duration-300"
                placeholder={t.messagePlaceholder}
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-400">{errors.message.message}</p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-lg text-white font-semibold transition duration-300 ${
                isSubmitting
                  ? 'bg-amber-600/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {isSubmitting ? t.processing : t.submitButton}
            </motion.button>

            {errorMessage && (
              <motion.p
                className="text-red-400 text-center mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {errorMessage}
              </motion.p>
            )}
          </motion.form>
        </div>
      </div>

      <AnimatePresence>
        {showModal && submittedData && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-800/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="text-2xl font-bold text-amber-400 mb-4">{t.modalTitle}</h3>
              <p className="text-gray-200 mb-6">
                {t.modalThankYou(submittedData.name)} <br />
                <strong>{t.modalMessage}:</strong> {submittedData.message} <br />
                {t.modalEmailConfirmation(submittedData.email)}
              </p>
              <motion.button
                onClick={closeModal}
                className="w-full py-3 px-6 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition duration-300"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {t.closeButton}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
