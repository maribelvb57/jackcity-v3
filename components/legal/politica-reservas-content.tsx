export function PoliticaReservasContent() {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{ color: "#374151" }}>
      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>1. Generación de la reserva</h3>
        <p>
          En JackCity queremos que reservar un hotel para tu mascota sea simple, claro y seguro.
        </p>
        <p>
          A través de nuestro portal podrás buscar hoteles, comparar, revisar sus características,
          seleccionar fechas de estadía y confirmar disponibilidad, agregar los datos y documentos
          de tu mascota y generar tu reserva mediante pago online.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>2. Pago de la reserva</h3>
        <p>
          Para generar una reserva de alojamiento, el usuario deberá pagar al momento de reservar
          un anticipo equivalente al <strong>30% del valor total del alojamiento</strong>.
        </p>
        <p>
          El <strong>70% restante</strong> del alojamiento deberá ser pagado directamente al hotel,
          en la forma, fecha y condiciones según los términos y políticas de cada hotel.
        </p>
        <p>
          JackCity actúa como intermediario tecnológico para facilitar la búsqueda, selección, pago
          inicial y confirmación de la reserva. El hotel es responsable de emitir la boleta o
          factura correspondiente por el valor total de los servicios prestados.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>3. Servicio de transporte</h3>
        <p>
          En caso de que el usuario seleccione el servicio de transporte, dicho servicio deberá ser
          pagado en un <strong>100% al momento de generar la reserva</strong>, junto con el
          anticipo del alojamiento.
        </p>
        <p>
          El transporte es prestado según disponibilidad por el hotel correspondiente o por
          JackCity y está sujeto a disponibilidad por fecha, comuna, zona de cobertura y franja
          horaria seleccionada.
        </p>
        <p>
          La contratación del transporte es opcional y se mostrará separada del valor del
          alojamiento antes de realizar el pago.
        </p>
        <p>
          Si la reserva no llega a confirmarse por causas no atribuibles al usuario, el valor
          pagado por transporte será reembolsado en un <strong>100%</strong>.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>4. Datos de la mascota</h3>
        <p>
          El usuario es responsable de entregar información completa y fidedigna sobre su mascota,
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
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>5. Confirmación de la reserva</h3>
        <p>
          Después de generada la reserva, esta se considera confirmada una vez que el hotel haya
          revisado todos los documentos y antecedentes enviados por el usuario y estos hayan sido
          aprobados conforme a los términos, requisitos y políticas propias de cada hotel.
        </p>
        <p>
          Una vez que el hotel apruebe los antecedentes, JackCity enviará la confirmación al correo
          electrónico informado por el usuario.
        </p>
        <p>
          Este paso es fundamental para que los hoteles puedan garantizar la seguridad y bienestar
          de todas las mascotas durante su permanencia en el recinto.
        </p>
        <p>
          El hotel contará con un plazo máximo de <strong>48 horas</strong> desde la generación de
          la reserva para revisar los antecedentes, o hasta la fecha de check-in si esta ocurriera
          antes. Si dentro de dicho plazo el hotel no aprueba la reserva, esta se cancelará
          automáticamente y el usuario recibirá la devolución del{" "}
          <strong>100% del monto pagado</strong>.
        </p>
        <p>
          Del mismo modo, si el hotel rechaza la reserva por causas no atribuibles al usuario
          —habiendo este entregado información veraz y completa— la reserva se cancelará y el
          usuario recibirá la devolución del <strong>100% del monto pagado</strong>. Lo anterior no
          aplica en los casos señalados en el punto 7, en que el rechazo se origine por información
          falsa, incompleta o incumplimiento de los requisitos por parte del usuario.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>6. Requisitos del hotel</h3>
        <p>
          Cada hotel puede establecer requisitos propios para recibir mascotas, tales como vacunas
          al día, desparasitación, sociabilidad, uso de collar, alimento, cama, medicamentos,
          ficha veterinaria u otros.
        </p>
        <p>El hotel puede establecer criterios de aceptación relacionados a:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>Tamaño y/o peso de las mascotas</li>
          <li>Raza</li>
          <li>Comportamiento y sociabilización</li>
          <li>Estado y condiciones de salud</li>
        </ul>
        <p>
          Estos requisitos serán informados en la ficha del hotel o directamente por el hotel antes
          del ingreso de la mascota.
        </p>
        <p>
          El usuario acepta que el incumplimiento de estos requisitos podría impedir la
          confirmación de la reserva y prestación del servicio.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>7. Responsabilidad del usuario</h3>
        <p>
          El usuario declara que la información entregada durante el proceso de reserva es
          verdadera, completa y actualizada.
        </p>
        <p>
          También se compromete a entregar a la mascota en buenas condiciones de salud y a informar
          oportunamente cualquier situación médica, conductual o especial que pueda afectar su
          estadía.
        </p>
        <p>
          Si lo anterior no se cumple, el usuario podría estar afecto a cancelación de su reserva
          sin reembolso del dinero abonado.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>8. Comunicación de la reserva</h3>
        <p>
          Una vez confirmada la reserva, JackCity podrá enviar al usuario información relacionada
          con la reserva, datos del hotel, instrucciones de ingreso, transporte, pagos pendientes,
          recordatorios y comunicaciones necesarias para la correcta prestación del servicio.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>9. Cancelaciones y devoluciones</h3>
        <p>
          El usuario podrá cancelar su reserva conforme a la Política de cancelación y devoluciones
          vigente en JackCity.
        </p>
        <p>
          Las reservas a hoteles con <strong>política de cancelación flexible</strong> pueden ser
          canceladas hasta las <strong>17:00 horas (hora de Chile) de dos días antes de la fecha de
          check-in</strong> de manera gratuita, con devolución del{" "}
          <strong>100% de lo pagado</strong> al momento de reservar.
        </p>
        <p>
          Las condiciones de cancelación de hoteles con otro tipo de políticas de cancelación más
          estrictas serán informadas al usuario en la plataforma al momento de reservar.
        </p>
        <p>
          Adicionalmente, toda reserva podrá cancelarse con devolución total dentro de las{" "}
          <strong>2 horas siguientes a su creación</strong>, cualquiera sea la fecha de check-in o
          tipo de política del hotel.
        </p>
      </section>
    </div>
  )
}
