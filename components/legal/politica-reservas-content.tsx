export function PoliticaReservasContent() {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{ color: "#374151" }}>
      <p>
        En JackCity queremos que reservar un hotel para tu mascota sea simple, claro y seguro.
      </p>
      <p>
        A través de nuestro portal podrás buscar hoteles disponibles, revisar sus características,
        seleccionar fechas de estadía, agregar los datos de tu mascota y confirmar tu reserva
        mediante pago online.
      </p>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>1. Confirmación de la reserva</h3>
        <p>
          Una reserva se considera confirmada únicamente cuando el pago online ha sido aprobado
          correctamente y JackCity ha enviado la confirmación al correo electrónico informado por
          el usuario.
        </p>
        <p>
          Mientras el pago no haya sido aprobado, la reserva no se entenderá confirmada y la
          disponibilidad del hotel podría cambiar.
        </p>
        <p>
          Al momento de reservar, la plataforma informará al usuario la fecha y hora exacta hasta
          la cual podrá cancelar gratuitamente su reserva.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>2. Pago de la reserva</h3>
        <p>
          Para confirmar una reserva de alojamiento, el usuario deberá pagar al momento de
          reservar un anticipo equivalente al 30% del valor total del alojamiento.
        </p>
        <p>
          El 70% restante del alojamiento deberá ser pagado directamente al hotel, en la forma,
          fecha y condiciones que cada hotel indique al momento del check-in, check-out o según
          sus propias reglas internas.
        </p>
        <p>
          JackCity actúa como intermediario tecnológico para facilitar la búsqueda, selección,
          pago inicial y confirmación de la reserva. El hotel es responsable de emitir la boleta o
          factura correspondiente por el valor total de los servicios prestados.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>3. Servicio de transporte</h3>
        <p>
          Algunos hoteles ofrecen servicio de transporte para las mascotas, el cual puede ser
          contratado a través de la plataforma junto con la reserva de alojamiento.
        </p>
        <p>
          En caso de que el usuario seleccione el servicio de transporte, dicho servicio deberá
          ser pagado en un 100% al momento de confirmar la reserva.
        </p>
        <p>
          El transporte es prestado por el hotel correspondiente y está sujeto a disponibilidad
          por fecha, comuna, zona de cobertura y franja horaria seleccionada.
        </p>
        <p>
          La contratación del transporte es opcional y se mostrará separada del valor del
          alojamiento antes de realizar el pago.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>4. Datos de la mascota</h3>
        <p>
          El usuario es responsable de entregar información completa y correcta sobre su mascota,
          incluyendo nombre, tamaño, raza, edad, peso, comportamiento, condiciones especiales de
          salud, medicamentos, vacunas, alimentación u otros antecedentes relevantes.
        </p>
        <p>
          El hotel podrá rechazar el ingreso de una mascota si la información entregada no
          corresponde con la realidad o si existen condiciones que pongan en riesgo a la mascota,
          a otras mascotas, al personal del hotel o al servicio contratado.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>5. Requisitos del hotel</h3>
        <p>
          Cada hotel puede establecer requisitos propios para recibir mascotas, tales como vacunas
          al día, desparasitación, sociabilidad, uso de collar, alimento, cama, medicamentos,
          ficha veterinaria u otros.
        </p>
        <p>
          Estos requisitos serán informados en la ficha del hotel o directamente por el hotel
          antes del ingreso de la mascota.
        </p>
        <p>
          El usuario acepta que el incumplimiento de estos requisitos podría impedir la prestación
          del servicio, sin que ello implique necesariamente devolución total del monto pagado.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>6. Responsabilidad del usuario</h3>
        <p>
          El usuario declara que la información entregada durante el proceso de reserva es
          verdadera, completa y actualizada.
        </p>
        <p>
          También se compromete a entregar a la mascota en buenas condiciones de salud y a
          informar oportunamente cualquier situación médica, conductual o especial que pueda
          afectar su estadía.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>7. Comunicación de la reserva</h3>
        <p>
          Una vez confirmada la reserva, JackCity podrá enviar al usuario información relacionada
          con la reserva, datos del hotel, instrucciones de ingreso, transporte, pagos pendientes,
          recordatorios y comunicaciones necesarias para la correcta prestación del servicio.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>8. Cancelaciones y devoluciones</h3>
        <p>
          El usuario podrá cancelar su reserva conforme a la Política de cancelación y
          devoluciones vigente en JackCity.
        </p>
        <p>
          Como regla general, las reservas canceladas hasta las{" "}
          <strong>17:00 horas (hora de Chile) de dos días antes de la fecha de check-in</strong>{" "}
          tendrán devolución del <strong>100% de lo pagado</strong> al momento de reservar. La
          plataforma informará al usuario el plazo exacto al momento de reservar.
        </p>
        <p>
          Adicionalmente, toda reserva podrá cancelarse con devolución total dentro de las{" "}
          <strong>2 horas siguientes a su creación</strong>, cualquiera sea la fecha de check-in.
        </p>
        <p>
          Las cancelaciones realizadas <strong>después del plazo de cancelación gratuita</strong>{" "}
          no tendrán devolución del anticipo de alojamiento, correspondiente al <strong>30% del
          valor total del alojamiento</strong>. Si el usuario contrató transporte, se devolverá el{" "}
          <strong>50% del valor pagado por dicho servicio</strong>, conforme a la Política de
          cancelación y devoluciones.
        </p>
      </section>
    </div>
  )
}
