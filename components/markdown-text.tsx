"use client"

import { useEffect, useState } from "react"
import ReactMarkdown, { defaultUrlTransform } from "react-markdown"

const MODAL_IMG_PREFIX = "modal-img:"

// react-markdown sanea los href y solo deja pasar http(s), mailto, xmpp e irc: cualquier
// otro protocolo lo reemplaza por "". Como `modal-img:` no está en esa lista, el href
// llegaba vacío al componente `a`. Lo dejamos pasar tal cual y delegamos el resto en el
// saneo por defecto (que sigue bloqueando `javascript:` y compañía).
function urlTransform(url: string) {
  return url.startsWith(MODAL_IMG_PREFIX) ? url : defaultUrlTransform(url)
}

// Texto en Markdown que llega desde el backend (p.ej. `description` de los requisitos
// del hotel cuando `descriptionMark` es true).
//
// Además de los links normales, soporta el esquema propio `modal-img:<url>`: en vez de
// navegar, abre la imagen en un modal. Ejemplo del texto que manda el backend:
//   Revisa el [ejemplo del carnet](modal-img:https://.../carnet.png) antes de reservar.
//
// Reusable: cualquier campo de texto que venga con marcado puede renderizarse con esto.
export function MarkdownText({ text, className }: { text: string; className?: string }) {
  const [imgModal, setImgModal] = useState<string | null>(null)

  // Cerrar el modal con Escape.
  useEffect(() => {
    if (!imgModal) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImgModal(null)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [imgModal])

  return (
    <div className={className}>
      <ReactMarkdown
        urlTransform={urlTransform}
        components={{
          // El contenedor ya define tamaño/color/leading; acá solo separamos párrafos.
          p: ({ children }) => <p className="[&:not(:first-child)]:mt-2">{children}</p>,
          a: ({ href, children }) => {
            if (href?.startsWith(MODAL_IMG_PREFIX)) {
              const imgUrl = href.slice(MODAL_IMG_PREFIX.length)
              return (
                <button
                  type="button"
                  onClick={() => setImgModal(imgUrl)}
                  className="underline underline-offset-2 transition-opacity hover:opacity-75"
                  style={{ color: "#0A1830" }}
                >
                  {children}
                </button>
              )
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 transition-opacity hover:opacity-75"
                style={{ color: "#0A1830" }}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {text}
      </ReactMarkdown>

      {imgModal && (
        <div
          onClick={() => setImgModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgModal} alt="" className="max-h-[85vh] max-w-full rounded-lg" />
            <button
              type="button"
              onClick={() => setImgModal(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
