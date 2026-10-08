/* ================================================================
   REPORTE COMPLETO DE HORAS TRABAJADAS
   Archivo: js/reporte-completo.js
   ================================================================ */

(function () {
  'use strict';

  const ReporteCompleto = {
    minutos(valor) {
      if (!valor) return 0;

      const partes = String(valor).split(':').map(Number);

      return Math.max(
        0,
        (partes[0] || 0) * 60 + (partes[1] || 0)
      );
    },

    valorExcel(minutos) {
      return Math.max(0, Number(minutos) || 0) / 1440;
    },

    fechaISO(fecha) {
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');

      return `${año}-${mes}-${dia}`;
    },

    semanaISO(fecha) {
      const utc = new Date(
        Date.UTC(
          fecha.getFullYear(),
          fecha.getMonth(),
          fecha.getDate()
        )
      );

      const dia = utc.getUTCDay() || 7;

      utc.setUTCDate(
        utc.getUTCDate() + 4 - dia
      );

      const inicioAño = new Date(
        Date.UTC(utc.getUTCFullYear(), 0, 1)
      );

      const semana = Math.ceil(
        (((utc - inicioAño) / 86400000) + 1) / 7
      );

      return (
        `${utc.getUTCFullYear()}-W` +
        String(semana).padStart(2, '0')
      );
    },

    obtenerRangoSemana(valor) {
      const resultado =
        /^(\d{4})-W(\d{2})$/.exec(valor || '');

      if (!resultado) {
        return null;
      }

      const año = Number(resultado[1]);
      const semana = Number(resultado[2]);

      const cuatroEnero =
        new Date(año, 0, 4, 12);

      const diaCuatroEnero =
        cuatroEnero.getDay() || 7;

      const lunes = new Date(cuatroEnero);

      lunes.setDate(
        cuatroEnero.getDate() -
        diaCuatroEnero +
        1 +
        (semana - 1) * 7
      );

      const domingo = new Date(lunes);

      domingo.setDate(
        lunes.getDate() + 6
      );

      return {
        inicio: this.fechaISO(lunes),
        fin: this.fechaISO(domingo)
      };
    },

    listaFechas(inicio, fin) {
      const fechas = [];

      const fechaActual =
        new Date(`${inicio}T12:00:00`);

      const fechaFinal =
        new Date(`${fin}T12:00:00`);

      while (fechaActual <= fechaFinal) {
        fechas.push(
          this.fechaISO(fechaActual)
        );

        fechaActual.setDate(
          fechaActual.getDate() + 1
        );
      }

      return fechas;
    },

    insertarEstilos() {
      if (
        document.getElementById(
          'estilos-reporte-completo'
        )
      ) {
        return;
      }

      const estilos =
        document.createElement('style');

      estilos.id =
        'estilos-reporte-completo';

      estilos.textContent = `
        .reporte-completo-panel {
          margin: 18px 0 14px;
          border: 1px solid var(--gris-200);
        }

        .reporte-completo-cabecera {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .reporte-completo-cabecera h3 {
          margin: 0 0 4px;
        }

        .reporte-completo-badge {
          padding: 6px 11px;
          border-radius: 999px;
          background: #dcfce7;
          color: #166534;
          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
        }

        .reporte-completo-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .reporte-completo-grid .campo {
          margin: 0;
        }

        .reporte-completo-grid [hidden] {
          display: none !important;
        }

        .reporte-completo-hojas {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin: 16px 0;
        }

        .reporte-completo-hojas span {
          padding: 11px 12px;
          border: 1px solid var(--gris-200);
          border-radius: var(--radio-sm);
          background: var(--gris-50);
          color: var(--gris-500);
          font-size: 12px;
        }

        @media (max-width: 760px) {
          .reporte-completo-grid,
          .reporte-completo-hojas {
            grid-template-columns: 1fr;
          }

          .reporte-completo-cabecera {
            align-items: center;
          }
        }
      `;

      document.head.appendChild(estilos);
    },

    crearInterfaz() {
      if (
        document.getElementById(
          'reporte-completo-panel'
        )
      ) {
        return;
      }

      const botones =
        document.querySelector(
          '#vista-reportes .fila-botones-exportar'
        );

      if (!botones) {
        console.error(
          'No se encontró la vista de reportes'
        );

        return;
      }

      const panel =
        document.createElement('div');

      panel.id =
        'reporte-completo-panel';

      panel.className =
        'tarjeta-grafico reporte-completo-panel';

      panel.innerHTML = `
        <div class="reporte-completo-cabecera">
          <div>
            <h3>
              Reporte completo de horas trabajadas
            </h3>

            <p class="sub">
              Descarga la información por día,
              semana, mes o rango personalizado.
            </p>
          </div>

          <span class="reporte-completo-badge">
            3 HOJAS
          </span>
        </div>

        <div class="reporte-completo-grid">

          <div class="campo">
            <label for="rc-tipo">
              Tipo de período
            </label>

            <select id="rc-tipo">
              <option value="dia">
                Por día
              </option>

              <option value="semana">
                Por semana
              </option>

              <option value="mes" selected>
                Por mes
              </option>

              <option value="personalizado">
                Personalizado
              </option>
            </select>
          </div>

          <div
            class="campo rc-fecha"
            id="rc-campo-dia"
            hidden
          >
            <label for="rc-dia">
              Seleccionar día
            </label>

            <input
              type="date"
              id="rc-dia"
            >
          </div>

          <div
            class="campo rc-fecha"
            id="rc-campo-semana"
            hidden
          >
            <label for="rc-semana">
              Seleccionar semana
            </label>

            <input
              type="week"
              id="rc-semana"
            >
          </div>

          <div
            class="campo rc-fecha"
            id="rc-campo-mes"
          >
            <label for="rc-mes">
              Seleccionar mes
            </label>

            <input
              type="month"
              id="rc-mes"
            >
          </div>

          <div
            class="campo rc-fecha"
            id="rc-campo-inicio"
            hidden
          >
            <label for="rc-inicio">
              Fecha inicial
            </label>

            <input
              type="date"
              id="rc-inicio"
            >
          </div>

          <div
            class="campo rc-fecha"
            id="rc-campo-fin"
            hidden
          >
            <label for="rc-fin">
              Fecha final
            </label>

            <input
              type="date"
              id="rc-fin"
            >
          </div>

          <div class="campo">
            <label for="rc-turno">
              Turno
            </label>

            <select id="rc-turno">
              <option value="">
                Todos los turnos
              </option>

              <option value="T01">
                Turno 01
              </option>

              <option value="T02">
                Turno 02
              </option>

              <option value="T03">
                Turno 03
              </option>
            </select>
          </div>

          <div class="campo">
            <label for="rc-trabajador">
              Trabajador
            </label>

            <select id="rc-trabajador">
              <option value="">
                Todos los trabajadores
              </option>
            </select>
          </div>
        </div>

        <div class="reporte-completo-hojas">
          <span>
            <strong>Hoja 1:</strong>
            Resumen por trabajador
          </span>

          <span>
            <strong>Hoja 2:</strong>
            Control diario
          </span>

          <span>
            <strong>Hoja 3:</strong>
            Detalle completo
          </span>
        </div>

        <button
          type="button"
          class="btn btn-excel btn-full"
          id="rc-generar"
        >
          GENERAR EXCEL COMPLETO
        </button>
      `;

      botones.parentNode.insertBefore(
        panel,
        botones
      );
    },

    mostrarCampos() {
      const tipo =
        document.getElementById(
          'rc-tipo'
        ).value;

      document
        .querySelectorAll('.rc-fecha')
        .forEach(campo => {
          campo.hidden = true;
        });

      const campos = {
        dia: [
          'rc-campo-dia'
        ],

        semana: [
          'rc-campo-semana'
        ],

        mes: [
          'rc-campo-mes'
        ],

        personalizado: [
          'rc-campo-inicio',
          'rc-campo-fin'
        ]
      };

      const camposVisibles =
        campos[tipo] || campos.mes;

      camposVisibles.forEach(id => {
        const campo =
          document.getElementById(id);

        if (campo) {
          campo.hidden = false;
        }
      });
    },

    obtenerRango() {
      const tipo =
        document.getElementById(
          'rc-tipo'
        ).value;

      if (tipo === 'dia') {
        const fecha =
          document.getElementById(
            'rc-dia'
          ).value;

        if (!fecha) {
          return null;
        }

        return {
          tipo,
          inicio: fecha,
          fin: fecha,
          nombre: fecha
        };
      }

      if (tipo === 'semana') {
        const semana =
          document.getElementById(
            'rc-semana'
          ).value;

        const rango =
          this.obtenerRangoSemana(
            semana
          );

        if (!rango) {
          return null;
        }

        return {
          tipo,
          inicio: rango.inicio,
          fin: rango.fin,
          nombre:
            `${rango.inicio}_al_${rango.fin}`
        };
      }

      if (tipo === 'mes') {
        const mes =
          document.getElementById(
            'rc-mes'
          ).value;

        if (!mes) {
          return null;
        }

        const partes =
          mes.split('-').map(Number);

        const ultimoDia =
          new Date(
            partes[0],
            partes[1],
            0
          ).getDate();

        return {
          tipo,
          inicio: `${mes}-01`,
          fin:
            `${mes}-` +
            String(ultimoDia).padStart(2, '0'),
          nombre: mes
        };
      }

      const inicio =
        document.getElementById(
          'rc-inicio'
        ).value;

      const fin =
        document.getElementById(
          'rc-fin'
        ).value;

      if (
        !inicio ||
        !fin ||
        inicio > fin
      ) {
        return null;
      }

      return {
        tipo,
        inicio,
        fin,
        nombre: `${inicio}_al_${fin}`
      };
    },

    async cargarTrabajadores() {
      const select =
        document.getElementById(
          'rc-trabajador'
        );

      const trabajadores =
        await DB.obtenerTrabajadores();

      const activos =
        trabajadores
          .filter(
            trabajador =>
              trabajador.estado !==
              'INACTIVO'
          )
          .sort((a, b) =>
            (
              `${a.apellidos || ''} ` +
              `${a.nombres || ''}`
            ).localeCompare(
              `${b.apellidos || ''} ` +
              `${b.nombres || ''}`,
              'es'
            )
          );

      select.innerHTML = `
        <option value="">
          Todos los trabajadores
        </option>
      `;

      activos.forEach(trabajador => {
        const opcion =
          document.createElement('option');

        opcion.value =
          String(trabajador.dni || '');

        const nombre =
          (
            `${trabajador.nombres || ''} ` +
            `${trabajador.apellidos || ''}`
          ).trim();

        opcion.textContent =
          `${nombre} · ${trabajador.dni}`;

        select.appendChild(opcion);
      });
    },

    async obtenerRegistros(filtros) {
      const historial =
        await DB.obtenerHistorial({
          fechaInicio: filtros.inicio,
          fechaFin: filtros.fin,
          dni: filtros.dni || null,
          turnoId: filtros.turno || null
        });

      const asistenciasActuales =
        await DB.obtenerAsistencias();

      const actuales =
        asistenciasActuales.filter(
          registro =>
            !registro.esDemo &&

            registro.fecha >=
              filtros.inicio &&

            registro.fecha <=
              filtros.fin &&

            (
              !filtros.dni ||
              String(registro.dni) ===
                filtros.dni
            ) &&

            (
              !filtros.turno ||
              registro.turnoId ===
                filtros.turno
            )
        );

      const registrosUnicos =
        new Map();

      [
        ...historial,
        ...actuales
      ].forEach(registro => {
        const clave =
          String(
            registro.id ||
            (
              `${registro.fecha}|` +
              `${registro.dni}|` +
              `${registro.turnoId}|` +
              `${registro.numeroJornada || 1}`
            )
          );

        registrosUnicos.set(
          clave,
          registro
        );
      });

      return [
        ...registrosUnicos.values()
      ].sort((a, b) => {
        const porFecha =
          String(a.fecha).localeCompare(
            String(b.fecha)
          );

        if (porFecha !== 0) {
          return porFecha;
        }

        const porNombre =
          String(
            a.nombreCompleto || ''
          ).localeCompare(
            String(
              b.nombreCompleto || ''
            ),
            'es'
          );

        if (porNombre !== 0) {
          return porNombre;
        }

        return (
          Number(
            a.numeroJornada || 1
          ) -
          Number(
            b.numeroJornada || 1
          )
        );
      });
    },

    crearHoja(
      titulo,
      rango,
      encabezados,
      datos,
      columnasDuracion = [],
      anchos = {}
    ) {
      const filas = [
        [titulo],

        [
          `Periodo: ` +
          `${UI.formatearFecha(rango.inicio)} ` +
          `al ${UI.formatearFecha(rango.fin)}`
        ],

        [
          `Generado: ` +
          `${UI.formatearFecha(_hoyISO())} ` +
          new Date().toLocaleTimeString(
            'es-PE',
            { hour12: false }
          )
        ],

        [
          `Registros incluidos: ` +
          `${rango.total}`
        ],

        [],

        encabezados,

        ...datos.map(fila =>
          encabezados.map(
            encabezado =>
              fila[encabezado] ?? ''
          )
        )
      ];

      const hoja =
        XLSX.utils.aoa_to_sheet(
          filas,
          {
            cellDates: true
          }
        );

      const ultimaColumna =
        encabezados.length - 1;

      const borde = {
        top: {
          style: 'thin',
          color: { rgb: 'D9E2F1' }
        },

        bottom: {
          style: 'thin',
          color: { rgb: 'D9E2F1' }
        },

        left: {
          style: 'thin',
          color: { rgb: 'D9E2F1' }
        },

        right: {
          style: 'thin',
          color: { rgb: 'D9E2F1' }
        }
      };

      hoja['!merges'] =
        [0, 1, 2, 3].map(fila => ({
          s: {
            r: fila,
            c: 0
          },

          e: {
            r: fila,
            c: ultimaColumna
          }
        }));

      hoja.A1.s = {
        fill: {
          fgColor: {
            rgb: '17499A'
          }
        },

        font: {
          name: 'Calibri',
          sz: 18,
          bold: true,
          color: {
            rgb: 'FFFFFF'
          }
        },

        alignment: {
          horizontal: 'left',
          vertical: 'center'
        }
      };

      [
        'A2',
        'A3',
        'A4'
      ].forEach(referencia => {
        hoja[referencia].s = {
          fill: {
            fgColor: {
              rgb: 'EAF1FB'
            }
          },

          font: {
            name: 'Calibri',
            sz: 10,
            color: {
              rgb: '334155'
            }
          }
        };
      });

      encabezados.forEach(
        (encabezado, columna) => {
          const referencia =
            XLSX.utils.encode_cell({
              r: 5,
              c: columna
            });

          const celda =
            hoja[referencia];

          celda.s = {
            fill: {
              fgColor: {
                rgb: '2563EB'
              }
            },

            font: {
              name: 'Calibri',
              sz: 10,
              bold: true,
              color: {
                rgb: 'FFFFFF'
              }
            },

            alignment: {
              horizontal: 'center',
              vertical: 'center',
              wrapText: true
            },

            border: borde
          };
        }
      );

      for (
        let numeroFila = 6;
        numeroFila < 6 + datos.length;
        numeroFila++
      ) {
        encabezados.forEach(
          (encabezado, columna) => {
            const referencia =
              XLSX.utils.encode_cell({
                r: numeroFila,
                c: columna
              });

            const celda =
              hoja[referencia];

            if (!celda) {
              return;
            }

            celda.s = {
              fill: {
                fgColor: {
                  rgb:
                    (numeroFila - 6) % 2 === 0
                      ? 'F4F7FC'
                      : 'FFFFFF'
                }
              },

              font: {
                name: 'Calibri',
                sz: 9,
                color: {
                  rgb: '1F2937'
                }
              },

              alignment: {
                vertical: 'center'
              },

              border: borde
            };

            if (
              columnasDuracion.includes(
                encabezado
              ) &&
              typeof celda.v === 'number'
            ) {
              celda.z = '[h]:mm';
            }

            const valor =
              String(
                celda.v || ''
              ).toUpperCase();

            if (
              valor.includes(
                'SIN SALIDA'
              ) ||
              valor.includes(
                'TARDANZA'
              )
            ) {
              celda.s.fill = {
                fgColor: {
                  rgb: 'FFEDD5'
                }
              };
            }

            if (
              valor.includes(
                'ANTICIPADA'
              ) ||
              valor.includes(
                'CIERRE AUTOMÁTICO'
              )
            ) {
              celda.s.fill = {
                fgColor: {
                  rgb: 'FEE2E2'
                }
              };
            }
          }
        );
      }

      hoja['!cols'] =
        encabezados.map(encabezado => ({
          wch:
            anchos[encabezado] ||
            15
        }));

      hoja['!rows'] = [
        { hpt: 30 },
        { hpt: 18 },
        { hpt: 18 },
        { hpt: 18 },
        { hpt: 8 },
        { hpt: 30 },

        ...datos.map(() => ({
          hpt: 20
        }))
      ];

      if (datos.length > 0) {
        hoja['!autofilter'] = {
          ref:
            XLSX.utils.encode_range({
              s: {
                r: 5,
                c: 0
              },

              e: {
                r:
                  5 +
                  datos.length,
                c:
                  ultimaColumna
              }
            })
        };
      }

      hoja['!freeze'] = {
        xSplit: 0,
        ySplit: 6,
        topLeftCell: 'A7',
        activePane: 'bottomLeft',
        state: 'frozen'
      };

      hoja['!pageSetup'] = {
        orientation: 'landscape',
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9
      };

      return hoja;
    },

    async generar() {
      if (
        typeof XLSX === 'undefined'
      ) {
        UI.toast(
          'No se cargó la librería de Excel',
          'error'
        );

        return;
      }

      const rango =
        this.obtenerRango();

      if (!rango) {
        UI.toast(
          'Selecciona correctamente el período',
          'alerta'
        );

        return;
      }

      const dni =
        document.getElementById(
          'rc-trabajador'
        ).value;

      const turnoId =
        document.getElementById(
          'rc-turno'
        ).value;

      const boton =
        document.getElementById(
          'rc-generar'
        );

      const textoOriginal =
        boton.textContent;

      boton.disabled = true;
      boton.textContent =
        'GENERANDO EXCEL...';

      try {
        const resultado =
          await Promise.all([
            this.obtenerRegistros({
              ...rango,
              dni,
              turno: turnoId
            }),

            DB.obtenerTrabajadores(),

            DB.obtenerTurnos()
          ]);

        const registros =
          resultado[0];

        const trabajadores =
          resultado[1];

        const turnos =
          resultado[2];

        if (!registros.length) {
          UI.toast(
            'No hay asistencias en ese período',
            'alerta'
          );

          return;
        }

        rango.total =
          registros.length;

        const trabajadoresMapa =
          new Map(
            trabajadores.map(
              trabajador => [
                String(
                  trabajador.dni
                ),

                trabajador
              ]
            )
          );

        const turnosMapa =
          new Map(
            turnos.map(
              turno => [
                turno.id,
                turno
              ]
            )
          );

        const personasMapa =
          new Map();

        trabajadores
          .filter(
            trabajador =>
              trabajador.estado !==
                'INACTIVO' &&

              (
                !dni ||
                String(
                  trabajador.dni
                ) === dni
              )
          )
          .forEach(trabajador => {
            personasMapa.set(
              String(
                trabajador.dni
              ),

              trabajador
            );
          });

        registros.forEach(registro => {
          const clave =
            String(
              registro.dni || ''
            );

          if (
            !personasMapa.has(clave)
          ) {
            personasMapa.set(
              clave,

              trabajadoresMapa.get(
                clave
              ) || {
                dni: clave,
                nombres:
                  registro.nombreCompleto,
                apellidos: ''
              }
            );
          }
        });

        const personas = [
          ...personasMapa.values()
        ].sort((a, b) =>
          (
            `${a.nombres || ''} ` +
            `${a.apellidos || ''}`
          ).localeCompare(
            `${b.nombres || ''} ` +
            `${b.apellidos || ''}`,
            'es'
          )
        );

        const resumen =
          personas.map(persona => {
            const registrosPersona =
              registros.filter(
                registro =>
                  String(
                    registro.dni
                  ) ===
                  String(
                    persona.dni
                  )
              );

            const diasTrabajados =
              new Set(
                registrosPersona.map(
                  registro =>
                    registro.fecha
                )
              ).size;

            let totalMinutos = 0;
            let minutosNormales = 0;
            let minutosExtras = 0;
            let tardanzas = 0;
            let salidasAnticipadas = 0;
            let sinSalida = 0;

            registrosPersona.forEach(
              registro => {
                const trabajados =
                  this.minutos(
                    registro.horasTrabajadas
                  );

                const turno =
                  turnosMapa.get(
                    registro.turnoId
                  );

                const esperados =
                  turno
                    ? duracionTurnoMinutos(
                        turno
                      )
                    : 480;

                totalMinutos +=
                  trabajados;

                minutosNormales +=
                  Math.min(
                    trabajados,
                    esperados
                  );

                minutosExtras +=
                  Math.max(
                    trabajados -
                      esperados,
                    0
                  );

                if (
                  (
                    registro.estadoEntrada ||
                    registro.estado
                  ) === 'TARDANZA'
                ) {
                  tardanzas++;
                }

                if (
                  String(
                    registro.estadoSalida ||
                    ''
                  ).includes(
                    'ANTICIPADA'
                  )
                ) {
                  salidasAnticipadas++;
                }

                if (
                  !registro.horaSalida
                ) {
                  sinSalida++;
                }
              }
            );

            return {
              DNI:
                String(
                  persona.dni || ''
                ),

              Trabajador:
                (
                  `${persona.nombres || ''} ` +
                  `${persona.apellidos || ''}`
                ).trim(),

              Área:
                persona.area || '',

              Cargo:
                persona.cargo || '',

              'Días trabajados':
                diasTrabajados,

              Jornadas:
                registrosPersona.length,

              'Total de horas':
                this.valorExcel(
                  totalMinutos
                ),

              'Horas normales':
                this.valorExcel(
                  minutosNormales
                ),

              'Horas extras':
                this.valorExcel(
                  minutosExtras
                ),

              Tardanzas:
                tardanzas,

              'Salidas anticipadas':
                salidasAnticipadas,

              'Sin salida':
                sinSalida,

              'Promedio diario':
                this.valorExcel(
                  diasTrabajados
                    ? Math.round(
                        totalMinutos /
                        diasTrabajados
                      )
                    : 0
                )
            };
          });

        const fechas =
          this.listaFechas(
            rango.inicio,
            rango.fin
          );

        const columnasDias =
          fechas.map(fecha =>
            (
              fecha.slice(8, 10) +
              '/' +
              fecha.slice(5, 7)
            )
          );

        const controlDiario =
          personas.map(persona => {
            const fila = {
              DNI:
                String(
                  persona.dni || ''
                ),

              Trabajador:
                (
                  `${persona.nombres || ''} ` +
                  `${persona.apellidos || ''}`
                ).trim()
            };

            let total = 0;

            fechas.forEach(
              (fecha, indice) => {
                const registrosDia =
                  registros.filter(
                    registro =>
                      String(
                        registro.dni
                      ) ===
                        String(
                          persona.dni
                        ) &&

                      registro.fecha ===
                        fecha
                  );

                const minutos =
                  registrosDia.reduce(
                    (
                      acumulado,
                      registro
                    ) =>
                      acumulado +
                      this.minutos(
                        registro.horasTrabajadas
                      ),

                    0
                  );

                total += minutos;

                const columna =
                  columnasDias[indice];

                if (
                  !registrosDia.length
                ) {
                  fila[columna] = '';
                } else if (
                  minutos === 0
                ) {
                  fila[columna] =
                    'SIN SALIDA';
                } else {
                  fila[columna] =
                    this.valorExcel(
                      minutos
                    );
                }
              }
            );

            fila.Total =
              this.valorExcel(
                total
              );

            return fila;
          });

        const detalle =
          registros.map(registro => {
            const trabajador =
              trabajadoresMapa.get(
                String(
                  registro.dni
                )
              ) || {};

            const turno =
              turnosMapa.get(
                registro.turnoId
              ) || {};

            const trabajados =
              this.minutos(
                registro.horasTrabajadas
              );

            const esperados =
              turno.inicio &&
              turno.fin
                ? duracionTurnoMinutos(
                    turno
                  )
                : 480;

            let minutosTardanza = 0;

            if (
              registro.horaEntrada &&
              turno.inicio &&
              (
                registro.estadoEntrada ||
                registro.estado
              ) === 'TARDANZA'
            ) {
              minutosTardanza =
                Math.max(
                  horaAMinutos(
                    registro.horaEntrada
                  ) -
                  horaAMinutos(
                    turno.inicio
                  ),

                  0
                );
            }

            return {
              'Fecha operativa':
                registro.fecha,

              DNI:
                String(
                  registro.dni || ''
                ),

              'Código QR':
                trabajador.qrId || '',

              Trabajador:
                registro.nombreCompleto ||
                (
                  `${trabajador.nombres || ''} ` +
                  `${trabajador.apellidos || ''}`
                ).trim(),

              Cargo:
                trabajador.cargo || '',

              Área:
                trabajador.area || '',

              Estado:
                trabajador.estado || '',

              Turno:
                registro.turnoId || '',

              'Nombre del turno':
                registro.turnoNombre ||
                turno.nombre ||
                '',

              'Horario programado':
                turno.inicio &&
                turno.fin
                  ? (
                      `${turno.inicio} - ` +
                      `${turno.fin}`
                    )
                  : '',

              Jornada:
                Number(
                  registro.numeroJornada ||
                  1
                ),

              Entrada:
                registro.horaEntrada ||
                '',

              Salida:
                registro.horaSalida ||
                '',

              'Horas trabajadas':
                this.valorExcel(
                  trabajados
                ),

              'Horas normales':
                this.valorExcel(
                  Math.min(
                    trabajados,
                    esperados
                  )
                ),

              'Horas extras':
                this.valorExcel(
                  Math.max(
                    trabajados -
                      esperados,
                    0
                  )
                ),

              'Estado entrada':
                registro.estadoEntrada ||
                registro.estado ||
                'PUNTUAL',

              'Minutos tardanza':
                minutosTardanza,

              'Estado salida':
                registro.estadoSalida ||
                'SIN SALIDA',

              'Minutos salida anticipada':
                Number(
                  registro.minutosSalidaAnticipada ||
                  0
                ),

              'Método entrada':
                registro.metodoEntrada ||
                registro.metodo ||
                'DNI',

              'Método salida':
                registro.metodoSalida ||
                '',

              'Supervisor entrada':
                _nombreSupervisor(
                  registro.supervisorEntrada
                ),

              'Supervisor salida':
                _nombreSupervisor(
                  registro.supervisorSalida
                ),

              Finalizado:
                registro.finalizado
                  ? 'SÍ'
                  : 'NO',

              'ID registro':
                registro.id || '',

              'Actualizado en':
                registro._remotoActualizadoEn ||
                registro._modificadoEn ||
                registro.actualizadoEn ||
                '',

              Observaciones:
                registro.observaciones ||
                (
                  String(
                    registro.estadoSalida ||
                    ''
                  ).includes(
                    'CIERRE AUTOMÁTICO'
                  )
                    ? registro.estadoSalida
                    : ''
                )
            };
          });

        const libro =
          XLSX.utils.book_new();

        const encabezadosResumen =
          Object.keys(
            resumen[0]
          );

        const encabezadosControl = [
          'DNI',
          'Trabajador',
          ...columnasDias,
          'Total'
        ];

        const encabezadosDetalle =
          Object.keys(
            detalle[0]
          );

        const hojaResumen =
          this.crearHoja(
            'RESUMEN POR TRABAJADOR',
            rango,
            encabezadosResumen,
            resumen,
            [
              'Total de horas',
              'Horas normales',
              'Horas extras',
              'Promedio diario'
            ],
            {
              DNI: 14,
              Trabajador: 32,
              Área: 18,
              Cargo: 18,
              'Días trabajados': 16,
              Jornadas: 12,
              'Total de horas': 16,
              'Horas normales': 16,
              'Horas extras': 15
            }
          );

        const hojaControl =
          this.crearHoja(
            'CONTROL DIARIO DE HORAS',
            rango,
            encabezadosControl,
            controlDiario,
            [
              ...columnasDias,
              'Total'
            ],
            {
              DNI: 14,
              Trabajador: 32,
              Total: 14
            }
          );

        const hojaDetalle =
          this.crearHoja(
            'DETALLE COMPLETO',
            rango,
            encabezadosDetalle,
            detalle,
            [
              'Horas trabajadas',
              'Horas normales',
              'Horas extras'
            ],
            {
              'Fecha operativa': 15,
              DNI: 14,
              'Código QR': 16,
              Trabajador: 32,
              Cargo: 18,
              Área: 18,
              Turno: 10,
              Entrada: 12,
              Salida: 12,
              'Estado entrada': 20,
              'Estado salida': 28,
              'ID registro': 30,
              Observaciones: 36
            }
          );

        XLSX.utils.book_append_sheet(
          libro,
          hojaResumen,
          '1 Resumen'
        );

        XLSX.utils.book_append_sheet(
          libro,
          hojaControl,
          '2 Control diario'
        );

        XLSX.utils.book_append_sheet(
          libro,
          hojaDetalle,
          '3 Detalle completo'
        );

        const nombres = {
          dia: 'Diario',
          semana: 'Semanal',
          mes: 'Mensual',
          personalizado:
            'Personalizado'
        };

        const nombreArchivo =
          (
            `Asistencia_` +
            `${nombres[rango.tipo]}_` +
            `${rango.nombre}.xlsx`
          );

        XLSX.writeFile(
          libro,
          nombreArchivo,
          {
            cellDates: true,
            bookSST: true
          }
        );

        UI.toast(
          'Excel completo generado correctamente',
          'exito'
        );
      } catch (error) {
        console.error(
          'Error al generar reporte',
          error
        );

        UI.toast(
          `No se pudo generar el Excel: ` +
          `${error.message}`,
          'error'
        );
      } finally {
        boton.disabled = false;
        boton.textContent =
          textoOriginal;
      }
    },

    async iniciar() {
      this.insertarEstilos();
      this.crearInterfaz();

      const hoy =
        _hoyISO();

      document.getElementById(
        'rc-dia'
      ).value = hoy;

      document.getElementById(
        'rc-mes'
      ).value = hoy.slice(0, 7);

      document.getElementById(
        'rc-inicio'
      ).value = hoy;

      document.getElementById(
        'rc-fin'
      ).value = hoy;

      document.getElementById(
        'rc-semana'
      ).value =
        this.semanaISO(
          new Date(
            `${hoy}T12:00:00`
          )
        );

      document.getElementById(
        'rc-tipo'
      ).addEventListener(
        'change',
        () => this.mostrarCampos()
      );

      document.getElementById(
        'rc-generar'
      ).addEventListener(
        'click',
        () => this.generar()
      );

      await this.cargarTrabajadores();

      this.mostrarCampos();
    }
  };

  window.addEventListener(
    'DOMContentLoaded',
    () => {
      ReporteCompleto
        .iniciar()
        .catch(error => {
          console.error(
            'No se pudo iniciar el reporte',
            error
          );
        });
    }
  );
})();
