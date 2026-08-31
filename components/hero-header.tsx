"use client"

import Image from "next/image"

export function HeroHeader() {
  return (
    <header className="w-full">
      {/* El mensaje del hero está dentro del JPG, así que no hay texto que
          Google pueda leer. Este h1 lo expone en el HTML sin alterar el diseño:
          sr-only lo oculta a la vista, pero sigue indexable y disponible para
          lectores de pantalla. Cuando el copy del hero pase a ser texto real,
          este h1 debería volverse visible en vez de duplicarse. */}
      <h1 className="sr-only">
        Encuentra hoteles para perros en Santiago de Chile
      </h1>
      <div className="flex items-center justify-center">
        <div className="relative w-full max-w-[1200px] aspect-[1101/1429] overflow-hidden md:aspect-[1695/794]">
          <Image
            src="/images/hero-bg-mobile.jpg"
            alt="Perro Jack Russell con anteojos de sol asomado dentro de una maleta de viaje. Porque con JackCity tu peque también se va de vacaciones: hospedaje premium, seguridad 24/7, amor y cuidado todo el día, fotos y videos diarios."
            fill
            className="object-cover object-center md:hidden"
            priority
          />
          <Image
            src="/images/hero-bg.jpg"
            alt="Perro Jack Russell con anteojos de sol asomado dentro de una maleta de viaje. Porque con JackCity tu peque también se va de vacaciones: hospedaje premium, seguridad 24/7, amor y cuidado todo el día, fotos y videos diarios. Más que un hotel, sus vacaciones felices."
            fill
            className="hidden object-cover object-center md:block"
            priority
          />
        </div>
      </div>
    </header>
  )
}
