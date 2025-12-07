const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://xanes-36606-default-rtdb.firebaseio.com'
});

const db = admin.database();

// Datos de carreras para importar
const carreras = {
  "Arquitectura_de_Plataformas_y_Servicios_de_TI": {
    "nombre": "Arquitectura de Plataformas y Servicios de TI",
    "ciclos": {
      "ciclo_I": {
        "cursos": [
          {
            "docente": "Manuel Esteban Mogollón García",
            "nombre": "Fundamentos y diseño de redes de comunicación"
          },
          {
            "docente": "Ing. Alberto Alexis Benites Pacherres",
            "nombre": "Mantenimiento de equipos de informáticos"
          },
          {
            "docente": "Manuel Esteban Mogollón García",
            "nombre": "Sistemas operativos para estaciones de trabajo"
          },
          {
            "docente": "Willeams M. Medina C.",
            "nombre": "Administración del centro de procesamiento de datos"
          },
          {
            "docente": "Mg. Geovanna Luna Flores",
            "nombre": "Comunicación oral"
          },
          {
            "docente": "Lic. Wuilmer Aleman Ludeña",
            "nombre": "Aplicaciones en internet"
          }
        ]
      },
      "ciclo_II": {
        "cursos": [
          {
            "docente": "Willeams M. Medina Curay",
            "nombre": "Instalación y configuración de redes de comunicación"
          },
          {
            "docente": "Manuel Esteban Mogollón García",
            "nombre": "Seguridad y optimización de redes de comunicación"
          },
          {
            "docente": "Ing. Alberto Alexis Benites Pacherres",
            "nombre": "Reparación de equipos informáticos"
          },
          {
            "docente": "Manuel Esteban Mogollón García",
            "nombre": "Administración de servidores de red"
          },
          {
            "docente": "Manuel Esteban Mogollón García",
            "nombre": "Sistemas operativos para servidores de red"
          },
          {
            "docente": "Mg. Geovanna Luna Flores",
            "nombre": "Interpretación y producción de textos"
          },
          {
            "docente": "Ing. Luis Vicente Castillo Boggio",
            "nombre": "Ofimática"
          }
        ]
      },
      "ciclo_III": {
        "cursos": [
          {
            "docente": "Ing. Mgtr. Jonathan Merino Farías",
            "nombre": "Desarrollo de programación"
          },
          {
            "docente": "Willeams M. Medina C.",
            "nombre": "Organización de recursos TI"
          },
          {
            "docente": "Ing. Karla Juvicza Neyra Alemán",
            "nombre": "Análisis y diseño de sistemas"
          },
          {
            "docente": "Prof. Tec. Juan Gabriel Alva Jimenez",
            "nombre": "Algoritmo de programación de computadoras"
          },
          {
            "docente": "Manuel Esteban Mogollón García",
            "nombre": "Base de datos"
          },
          {
            "docente": "Prof. Angel Javier Solis Lavalle",
            "nombre": "Inglés para la comunicación oral"
          },
          {
            "docente": "Dra. Sylvia Janet Trelles Quiroz",
            "nombre": "Comportamiento ético"
          }
        ]
      },
      "ciclo_IV": {
        "cursos": [
          {
            "docente": "Ing. Mgtr. Jonathan Merino Farías",
            "nombre": "Fundamentos de desarrollo web"
          },
          {
            "docente": "Manuel Esteban Mogollón García",
            "nombre": "Administración de base de datos"
          },
          {
            "docente": "Ing. Mgtr. Jonathan Merino Farías",
            "nombre": "Desarrollo de aplicaciones"
          },
          {
            "docente": "Ing. Karla Juvicza Neyra Alemán",
            "nombre": "Metodologías de desarrollo de software"
          },
          {
            "docente": "Prof. Angel Javier Solis Lavalle",
            "nombre": "Comprensión y redacción en inglés"
          },
          {
            "docente": "Dra. Sylvia Janet Trelles Quiroz",
            "nombre": "Resolución de problemas"
          }
        ]
      },
      "ciclo_V": {
        "cursos": [
          {
            "docente": "Willeams M. Medina Curay",
            "nombre": "Herramientas de diseño gráfico"
          },
          {
            "docente": "Manuel Esteban Mogollón García",
            "nombre": "Arquitectura de la información"
          },
          {
            "docente": "Ing. Mgtr. Jonathan Merino Farías",
            "nombre": "Desarrollo de aplicaciones web"
          },
          {
            "docente": "Willeams M. Medina Curay",
            "nombre": "Desarrollo de recursos TIC's"
          },
          {
            "docente": "Prof. Tec. Juan Gabriel Alva Jimenez",
            "nombre": "Aplicaciones con webservices"
          },
          {
            "docente": "Eco Cesar Canepa La Cotera",
            "nombre": "Oportunidades de negocio"
          },
          {
            "docente": "Dra. Sylvia Janet Trelles Quiroz",
            "nombre": "Fundamentos de innovación tecnológica"
          }
        ]
      },
      "ciclo_VI": {
        "cursos": [
          {
            "docente": "Prof. Tec. Juan Gabriel Alva Jimenez",
            "nombre": "Desarrollo multimedia"
          },
          {
            "docente": "Ing. Mgtr. Jonathan Merino Farias",
            "nombre": "Arquitectura y programación web"
          },
          {
            "docente": "Willeams M. Medina Curay",
            "nombre": "Comercio Electrónico"
          },
          {
            "docente": "Ing. Mgtr. Jonathan Merino Farias",
            "nombre": "Aplicaciones móviles"
          },
          {
            "docente": "Prof. Tec. Juan Gabriel Alva Jimenez",
            "nombre": "Seguridad informática"
          },
          {
            "docente": "Eco Cesar Canepa La Cotera",
            "nombre": "Plan de negocios"
          },
          {
            "docente": "Ing. Karla Juvicza Neyra Alemán",
            "nombre": "Innovación tecnológica"
          }
        ]
      }
    }
  }
};

async function importCarreras() {
  try {
    console.log('📚 Iniciando importación de carreras...');
    
    // Guardar en la ruta: carreras/{nombreCarrera}
    await db.ref('carreras').update(carreras);
    
    console.log('✅ Carreras importadas exitosamente!');
    console.log('\n📍 Datos guardados en: /carreras/Arquitectura_de_Plataformas_y_Servicios_de_TI');
    console.log('\nEstructura:');
    console.log('  - nombre: Arquitectura de Plataformas y Servicios de TI');
    console.log('  - ciclos/ciclo_I/cursos/[] (6 cursos)');
    console.log('  - ciclos/ciclo_II/cursos/[] (7 cursos)');
    console.log('  - ciclos/ciclo_III/cursos/[] (7 cursos)');
    console.log('  - ciclos/ciclo_IV/cursos/[] (6 cursos)');
    console.log('  - ciclos/ciclo_V/cursos/[] (7 cursos)');
    console.log('  - ciclos/ciclo_VI/cursos/[] (7 cursos)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al importar carreras:', error);
    process.exit(1);
  }
}

importCarreras();
