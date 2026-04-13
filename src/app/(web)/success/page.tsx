import Link from "next/link";

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl transform transition-all hover:scale-[1.02]">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-green-500 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="mt-6 text-4xl font-extrabold text-gray-800 tracking-tight">
            Commande passée !
          </h2>
          <p className="mt-3 text-lg text-gray-600 leading-relaxed">
            Miam ! Votre commande est confirmée et nos chefs commencent à la préparer.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="bg-orange-50 p-6 rounded-lg text-gray-700">
            <p className="text-base font-medium">Vous recevrez bientôt un e-mail de confirmation.</p>
          </div>
          <div className="flex flex-col space-y-4">
            <Link
              href="/menu"
              className="w-full py-3 px-6 border border-transparent rounded-full shadow-md text-base font-semibold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200 transition duration-300"
            >
              Explorer le menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
