export function PoliticaCancelacionContent() {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{ color: "#374151" }}>
      <p>
        Entendemos que los planes pueden cambiar. Por eso, en JackCity buscamos que nuestra
        política de cancelación sea simple, clara y fácil de entender.
      </p>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>1. Cancelaciones hasta 48 horas antes del check-in</h3>
        <p>
          Si el usuario cancela su reserva hasta 48 horas antes de la fecha y hora de check-in,
          JackCity devolverá el <strong>100% de lo pagado</strong> al momento de reservar.
        </p>
        <p>Esto incluye:</p>
        <ul className="flex flex-col gap-1.5 pl-5 list-disc">
          <li>El anticipo del alojamiento pagado online.</li>
          <li>El valor del transporte, si fue contratado.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>2. Cancelaciones con menos de 48 horas de anticipación</h3>
        <p>
          Si el usuario cancela su reserva con menos de 48 horas de anticipación al check-in,
          no se devolverá el anticipo pagado por alojamiento.
        </p>
        <p>
          En este caso, el monto retenido corresponderá al <strong>30% del valor total del
          alojamiento</strong>, pagado al momento de confirmar la reserva.
        </p>
        <p>
          El 70% restante del alojamiento no será cobrado por JackCity, ya que corresponde a un
          saldo que el usuario paga directamente al hotel.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>3. Devolución del transporte</h3>
        <p>
          Si el usuario contrató transporte y cancela la reserva, JackCity devolverá el{" "}
          <strong>100% del valor pagado por transporte</strong>, incluso si la cancelación se
          realiza con menos de 48 horas de anticipación.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>4. No presentación</h3>
        <p>
          Si el usuario no se presenta en la fecha y horario acordado, o no entrega a la mascota
          en el lugar correspondiente sin aviso previo, la reserva se considerará cancelada fuera
          de plazo.
        </p>
        <p>
          En ese caso, no se devolverá el anticipo pagado por alojamiento. Si existía transporte
          contratado, JackCity podrá devolver el monto pagado por dicho servicio, siempre que
          este no haya sido utilizado.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>5. Cancelación por parte del hotel o JackCity</h3>
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
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>6. Plazos de devolución</h3>
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
