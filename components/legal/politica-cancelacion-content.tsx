export function PoliticaCancelacionContent() {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{ color: "#374151" }}>
      <p>
        Entendemos que los planes pueden cambiar. Por eso, en JackCity buscamos que nuestra
        política de cancelación sea lo más simple, clara y fácil de entender.
      </p>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>1. Políticas de cancelación</h3>
        <p>
          En JackCity tenemos algunos hoteles partner asociados con políticas de cancelación
          flexible y otros hoteles con niveles de cancelación más estrictos. La política aplicable a
          cada hotel es indicada al usuario en la plataforma al momento de realizar la reserva.
        </p>
        <p>
          Las penalizaciones y condiciones de cancelación descritas en esta política aplican
          únicamente sobre <strong>reservas ya confirmadas por el hotel</strong>. Si la reserva se
          encuentra pendiente de aprobación o es rechazada por el hotel, se regirá por lo señalado
          en la Política de reservas, con devolución del <strong>100% de lo pagado</strong> cuando
          el rechazo no sea atribuible al usuario.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>2. Hoteles con política de cancelación flexible</h3>
        <p>
          Estos hoteles permiten cancelar tu reserva de forma gratuita hasta las{" "}
          <strong>17:00 hrs (hora de Chile) de dos días antes de la fecha de check-in</strong>, sin
          costo por cancelación y con el <strong>100% del reembolso</strong> del dinero abonado a tu
          reserva.
        </p>
        <p>
          Después de ese momento, el hotel cobra una penalización equivalente al{" "}
          <strong>30% del valor total del alojamiento</strong>, monto que corresponde al anticipo
          abonado en JackCity al momento de reservar.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>3. Hoteles con política de cancelación no flexible</h3>
        <p>
          Algunos hoteles cuentan con políticas de cancelación más estrictas que la flexible, según
          sus propias reglas internas.
        </p>
        <p>
          Las condiciones específicas de cancelación, plazos y montos de penalización de estos
          hoteles serán informadas al usuario en la plataforma al momento de realizar la reserva, y
          el usuario deberá aceptarlas para poder completar el pago.
        </p>
        <p>
          En estos casos, la penalización por cancelación puede ser mayor a la de los hoteles
          flexibles, pudiendo alcanzar hasta el <strong>100% del monto abonado</strong>, según lo
          indicado por cada hotel.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>4. Devolución de pagos por servicios de transporte</h3>
        <p>
          El reembolso de lo pagado por transporte procede únicamente cuando se cancela la reserva,
          según el momento en que se solicite:
        </p>
        <ul className="flex flex-col gap-1.5 pl-5 list-disc">
          <li>
            <strong>Hasta 2 días antes de la fecha de check-in</strong> (límite 17:00 hrs, hora de
            Chile): reembolso del <strong>100%</strong> de lo pagado por transporte (recogida y
            regreso).
          </li>
          <li>
            <strong>Hasta la fecha de check-out</strong>: reembolso únicamente del valor pagado por
            el servicio de regreso.
          </li>
          <li>
            <strong>Después de la fecha de check-out</strong>: ningún valor pagado por transporte es
            reembolsable.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>5. Ventana de gracia</h3>
        <p>
          Toda reserva podrá cancelarse con devolución del <strong>100% de lo pagado</strong>{" "}
          dentro de las <strong>2 horas siguientes a su creación</strong>, cualquiera sea la fecha
          de check-in.
        </p>
        <p>
          Esta ventana de gracia aplica incluso a reservas realizadas después del plazo de
          cancelación gratuita.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>6. Reservas realizadas después del plazo de cancelación gratuita</h3>
        <p>
          Las reservas creadas cuando ya ha vencido el plazo de cancelación gratuita (por ejemplo,
          reservas de último minuto) no son reembolsables, salvo la ventana de gracia de 2 horas
          indicada en el punto anterior.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>7. No presentación (no-show)</h3>
        <p>
          Si el usuario no se presenta en la fecha y horario acordado, o no está disponible para la
          entrega de la mascota en el lugar correspondiente sin aviso previo, la reserva se
          considerará cancelada fuera de plazo y aplicarán las políticas y condiciones indicadas al
          momento de realizar la reserva.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>8. Cancelación por parte del hotel o JackCity</h3>
        <p>
          En casos excepcionales, el hotel o JackCity podrían cancelar una reserva por motivos
          operacionales, sanitarios, de seguridad, fuerza mayor o imposibilidad de prestar el
          servicio.
        </p>
        <p>
          Si esto ocurre, JackCity podrá ofrecer una alternativa similar o gestionar la devolución
          del <strong>100% de lo pagado</strong> por el usuario.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>9. Plazos de devolución</h3>
        <p>
          Cuando corresponda una devolución, JackCity la gestionará a través del mismo medio de
          pago utilizado por el usuario u otro mecanismo informado oportunamente.
        </p>
        <p>
          Los plazos de abono pueden depender del medio de pago, banco emisor, tarjeta utilizada y
          procesos del proveedor de pago.
        </p>
      </section>
    </div>
  )
}
