export function PoliticaCancelacionContent() {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{ color: "#374151" }}>
      <p>
        Entendemos que los planes pueden cambiar. Por eso, en JackCity buscamos que nuestra
        política de cancelación sea simple, clara y fácil de entender.
      </p>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>1. Plazo de cancelación gratuita</h3>
        <p>
          El usuario podrá cancelar su reserva con derecho a devolución del{" "}
          <strong>100% de lo pagado</strong> hasta las <strong>17:00 horas (hora de Chile)</strong>{" "}
          del día que corresponda a <strong>dos días antes de la fecha de check-in</strong>.
        </p>
        <p>
          La plataforma informará al usuario, al momento de reservar, la fecha y hora exacta hasta
          la cual podrá cancelar gratuitamente.
        </p>
        <p>La devolución del 100% incluye:</p>
        <ul className="flex flex-col gap-1.5 pl-5 list-disc">
          <li>El anticipo del alojamiento pagado online.</li>
          <li>El valor del transporte, si fue contratado.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>2. Ventana de gracia</h3>
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
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>3. Reservas realizadas después del plazo de cancelación gratuita</h3>
        <p>
          Las reservas creadas cuando ya ha vencido el plazo de cancelación gratuita (por ejemplo,
          reservas de último minuto) no son reembolsables, salvo la ventana de gracia de 2 horas
          indicada en el punto anterior.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>4. Cancelaciones fuera de plazo</h3>
        <p>Si el usuario cancela su reserva después del plazo de cancelación gratuita:</p>
        <ul className="flex flex-col gap-1.5 pl-5 list-disc">
          <li>
            No se devolverá el anticipo pagado por alojamiento, correspondiente al{" "}
            <strong>30% del valor total del alojamiento</strong>. El 70% restante no será cobrado,
            ya que corresponde al saldo que el usuario paga directamente al hotel.
          </li>
          <li>
            Si el usuario contrató transporte, se devolverá el{" "}
            <strong>50% del valor pagado por transporte</strong>. El 50% restante, correspondiente
            al tramo de ida, será retenido.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>5. No presentación (no-show)</h3>
        <p>
          Si el usuario no se presenta en la fecha y horario acordado, o no entrega a la mascota
          en el lugar correspondiente sin aviso previo, la reserva se considerará cancelada fuera
          de plazo y aplicarán las mismas condiciones del punto 4.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>6. Cancelación por parte del hotel o JackCity</h3>
        <p>
          En casos excepcionales, el hotel o JackCity podrían cancelar una reserva por motivos
          operacionales, sanitarios, de seguridad, fuerza mayor o imposibilidad de prestar el
          servicio.
        </p>
        <p>
          Si esto ocurre, JackCity podrá ofrecer una alternativa similar o gestionar la
          devolución del <strong>100% de lo pagado</strong> por el usuario.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>7. Plazos de devolución</h3>
        <p>
          Cuando corresponda una devolución, JackCity la gestionará a través del mismo medio de
          pago utilizado por el usuario u otro mecanismo informado oportunamente.
        </p>
        <p>
          Los plazos de abono pueden depender del medio de pago, banco emisor, tarjeta utilizada
          y procesos del proveedor de pago.
        </p>
      </section>
    </div>
  )
}
