import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-white">North </span>
            <span className="text-primary-500">Padel</span>
            <span className="text-white"> Club</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Reserva tu cancha de pádel de manera rápida y sencilla. 
            Las mejores instalaciones para disfrutar de tu deporte favorito.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reservar" className="btn-primary text-lg px-8 py-4">
              Reservar Cancha
            </Link>
            <Link href="/auth/login" className="btn-secondary text-lg px-8 py-4">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-dark-400">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            ¿Por qué elegirnos?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="🎾"
              title="Canchas Premium"
              description="Instalaciones de primera calidad con iluminación profesional y césped sintético de última generación."
            />
            <FeatureCard 
              icon="📱"
              title="Reserva Online"
              description="Sistema de reservas 24/7. Reserva tu cancha desde cualquier dispositivo en segundos."
            />
            <FeatureCard 
              icon="⭐"
              title="Mejor Experiencia"
              description="Atención personalizada, vestuarios equipados y estacionamiento gratuito."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-dark-100">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>© 2025 North Padel Club. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { 
  icon: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="card text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
