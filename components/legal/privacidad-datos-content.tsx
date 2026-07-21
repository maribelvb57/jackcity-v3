export function PrivacidadDatosContent() {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{ color: "#374151" }}>
      <p>
        En JackCity nos importa proteger la información de nuestros usuarios y usarla solo para
        entregar una mejor experiencia de reserva y cuidado de mascotas.
      </p>
      <p>
        Esta Política de Privacidad explica qué datos recopilamos, para qué los usamos y cómo
        puedes ejercer tus derechos.
      </p>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>1. Responsable del tratamiento</h3>
        <p>
          El responsable del tratamiento de los datos personales recopilados a través de
          JackCity.cl es:
        </p>
        <ul className="flex flex-col gap-1 pl-5 list-disc">
          <li><strong>Razón social:</strong> AndesBits SpA</li>
          <li><strong>RUT:</strong> 78.417.952-4</li>
          <li><strong>Correo de contacto:</strong> contacto@jackcity.cl</li>
          <li><strong>Sitio web:</strong> www.jackcity.cl</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>2. Datos que recopilamos</h3>
        <p>JackCity podrá recopilar los siguientes datos:</p>
        <ul className="flex flex-col gap-2 pl-5 list-disc">
          <li>
            <strong>Datos del usuario:</strong> nombre, apellido, correo electrónico, teléfono,
            RUT cuando sea necesario, dirección, comuna, ciudad y país.
          </li>
          <li>
            <strong>Datos de reserva:</strong> fechas de entrada y salida, hotel seleccionado,
            servicios contratados, transporte, montos pagados, saldo pendiente, estado de la
            reserva e historial de reservas.
          </li>
          <li>
            <strong>Datos de mascotas:</strong> nombre, raza, tamaño, edad, peso, sexo, color,
            condiciones especiales, alimentación, medicamentos, vacunas u otros datos necesarios
            para la estadía.
          </li>
          <li>
            <strong>Datos de pago:</strong> JackCity no almacena directamente los datos completos
            de tarjetas bancarias. Los pagos son procesados mediante proveedores externos
            autorizados, como Transbank u otros medios de pago disponibles.
          </li>
          <li>
            <strong>Datos técnicos:</strong> dirección IP, navegador, dispositivo, páginas
            visitadas, fecha y hora de navegación, cookies, identificadores de sesión y datos de
            uso del sitio.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>3. Para qué usamos los datos</h3>
        <p>Usamos los datos para:</p>
        <ul className="flex flex-col gap-1.5 pl-5 list-disc">
          <li>Procesar cotizaciones, reservas y pagos.</li>
          <li>Confirmar disponibilidad con hoteles asociados.</li>
          <li>Coordinar estadías y el servicio de transporte prestado por los hoteles asociados.</li>
          <li>Enviar confirmaciones, recordatorios y comunicaciones relacionadas con la reserva.</li>
          <li>Crear o administrar cuentas de usuario, cuando corresponda.</li>
          <li>Guardar datos de usuarios y mascotas si el usuario decide hacerlo.</li>
          <li>Mejorar la experiencia del sitio y nuestros servicios.</li>
          <li>Prevenir fraude, errores, mal uso de la plataforma o problemas de seguridad.</li>
          <li>Cumplir obligaciones legales, tributarias, contables o regulatorias.</li>
          <li>
            Enviar comunicaciones comerciales, promociones o novedades, solo cuando corresponda y
            respetando las opciones de baja disponibles.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>4. Con quién compartimos datos</h3>
        <p>JackCity podrá compartir datos necesarios con:</p>
        <ul className="flex flex-col gap-1.5 pl-5 list-disc">
          <li>
            Hoteles o prestadores asociados, para gestionar la estadía de la mascota y, cuando
            corresponda, el transporte contratado.
          </li>
          <li>Proveedores de pago, como Transbank u otros procesadores.</li>
          <li>
            Proveedores tecnológicos, hosting, autenticación, correo, analítica, almacenamiento
            o soporte.
          </li>
          <li>Autoridades públicas, cuando exista obligación legal.</li>
        </ul>
        <p>Solo compartimos la información necesaria para cumplir la finalidad correspondiente.</p>
        <p>
          Los hoteles asociados solo pueden usar los datos personales recibidos a través de la
          plataforma para gestionar las reservas correspondientes, conforme a la legislación
          chilena de protección de datos personales, y no están autorizados a usarlos para otros
          fines ni a compartirlos con terceros.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>5. Datos de mascotas</h3>
        <p>
          La información sobre mascotas se utiliza para facilitar una estadía segura y adecuada.
        </p>
        <p>
          El usuario entiende que ciertos datos de la mascota deberán ser compartidos con el
          hotel seleccionado para poder prestar correctamente el servicio de alojamiento y, si
          corresponde, de transporte.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>6. Conservación de datos</h3>
        <p>
          JackCity conservará los datos personales durante el tiempo necesario para cumplir las
          finalidades descritas en esta política, prestar servicios, mantener historial de
          reservas, responder consultas, cumplir obligaciones legales o resolver eventuales
          controversias.
        </p>
        <p>
          Cuando los datos ya no sean necesarios, podrán ser eliminados, anonimizados o
          bloqueados según corresponda.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>7. Seguridad</h3>
        <p>
          JackCity adoptará medidas razonables de seguridad para proteger los datos personales
          contra pérdida, mal uso, acceso no autorizado, alteración o divulgación indebida.
        </p>
        <p>
          Sin embargo, ningún sistema digital es completamente infalible, por lo que el usuario
          también debe cuidar sus credenciales, dispositivos y medios de acceso.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>8. Derechos del usuario</h3>
        <p>
          El usuario podrá solicitar acceso, rectificación, actualización o eliminación de sus
          datos personales, cuando corresponda conforme a la legislación chilena de protección de
          datos personales.
        </p>
        <p>Para ejercer estos derechos, podrá escribir a:</p>
        <p className="font-semibold" style={{ color: "#0A1830" }}>contacto@jackcity.cl</p>
        <p>
          La solicitud deberá indicar nombre, correo asociado y detalle de lo solicitado.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>9. Cookies y tecnologías similares</h3>
        <p>
          JackCity podrá utilizar cookies y tecnologías similares para recordar preferencias,
          mantener sesiones, analizar uso del sitio, mejorar la experiencia y apoyar acciones de
          marketing o medición.
        </p>
        <p>
          El usuario puede configurar su navegador para rechazar o eliminar cookies, aunque
          algunas funcionalidades del sitio podrían verse afectadas.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>10. Comunicaciones</h3>
        <p>
          JackCity podrá enviar correos relacionados con reservas, pagos, transporte, cambios de
          estado, recordatorios y atención al cliente.
        </p>
        <p>
          También podrá enviar novedades, promociones o información comercial si el usuario lo ha
          autorizado o si existe una relación previa permitida por la normativa aplicable.
        </p>
        <p>
          El usuario podrá solicitar dejar de recibir comunicaciones comerciales cuando lo estime
          conveniente.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>11. Cambios a esta política</h3>
        <p>
          JackCity podrá actualizar esta Política de Privacidad cuando sea necesario.
        </p>
        <p>
          La versión vigente estará siempre disponible en el sitio web.
        </p>
      </section>
    </div>
  )
}
