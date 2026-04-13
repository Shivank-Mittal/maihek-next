import Link from "next/link";

export default function OrderCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-100 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl transform transition-all hover:scale-[1.02]">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-red-500 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <h2 className="mt-6 text-4xl font-extrabold text-gray-800 tracking-tight">
            Commande annulée
          </h2>
          <p className="mt-3 text-lg text-gray-600 leading-relaxed">
            Pas d’inquiétude, votre commande n’a pas été traitée.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="bg-red-50 p-6 rounded-lg text-gray-700">
            <p className="text-base font-medium">Il semble que vous ayez annulé votre commande.</p>
            <p className="mt-3 text-sm">Que souhaitez-vous faire maintenant&nbsp;?</p>
            <ul className="mt-2 text-sm list-none space-y-2">
              <li className="flex items-center">
                <span className="text-red-500 mr-2">•</span> Essayer de passer votre commande à nouveau
              </li>
              <li className="flex items-center">
                <span className="text-red-500 mr-2">•</span> Découvrir notre délicieux menu
              </li>
              <li className="flex items-center">
                <span className="text-red-500 mr-2">•</span> Nous contacter pour obtenir de l’aide
              </li>
            </ul>
          </div>
          <div className="flex flex-col space-y-4">
            
            <Link
              href="/menu"
              className="w-full py-3 px-6 border border-red-300 rounded-full text-base font-semibold text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-200 transition duration-300"
            >
              Retour au menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
