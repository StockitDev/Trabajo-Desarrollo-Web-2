"use strict";

const API_URL = "https://pokeapi.co/api/v2";
const PRIMER_POKEMON = 252;
const ULTIMO_POKEMON = 386;

const nombresTipos = {
  normal: "Normal",
  fighting: "Lucha",
  flying: "Volador",
  poison: "Veneno",
  ground: "Tierra",
  rock: "Roca",
  bug: "Bicho",
  ghost: "Fantasma",
  steel: "Acero",
  fire: "Fuego",
  water: "Agua",
  grass: "Planta",
  electric: "Eléctrico",
  psychic: "Psíquico",
  ice: "Hielo",
  dragon: "Dragón",
  dark: "Siniestro",
  fairy: "Hada"
};

const nombresStats = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "Ataque especial",
  "special-defense": "Defensa especial",
  speed: "Velocidad"
};

async function consultarPokemon(busqueda) {
  const termino = busqueda.trim().toLowerCase();

  if (!termino) {
    throw new Error("Escribe un número o un nombre para buscar.");
  }

  if (/^\d+$/.test(termino)) {
    const numero = Number(termino);
    if (numero < PRIMER_POKEMON || numero > ULTIMO_POKEMON) {
      throw new Error("El número debe estar entre 252 y 386.");
    }
  }

  const respuestaPokemon = await fetch(
    `${API_URL}/pokemon/${encodeURIComponent(termino)}`
  );
  if (!respuestaPokemon.ok) {
    if (respuestaPokemon.status === 404) {
      throw new Error("No encontramos ese Pokémon. Revisa el nombre o el número.");
    }
    throw new Error("No se pudo conectar con PokéAPI. Inténtalo de nuevo.");
  }

  const pokemon = await respuestaPokemon.json();
  if (pokemon.id < PRIMER_POKEMON || pokemon.id > ULTIMO_POKEMON) {
    throw new Error("Este consultor solo incluye la tercera generación.");
  }

  const respuestaEspecie = await fetch(
    `${API_URL}/pokemon-species/${pokemon.id}`
  );
  if (!respuestaEspecie.ok) {
    throw new Error("No pudimos cargar el nombre en español.");
  }

  const especie = await respuestaEspecie.json();
  const nombreEnEspanol = especie.names.find(nombre =>
    nombre.language.name === "es"
  );

  return {
    id: pokemon.id,
    nombre: nombreEnEspanol ? nombreEnEspanol.name : pokemon.name,
    imagen: pokemon.sprites.other["official-artwork"].front_default ||
      pokemon.sprites.front_default,
    tipos: pokemon.types.map(dato =>
      nombresTipos[dato.type.name] || dato.type.name
    ),
    altura: pokemon.height / 10,
    peso: pokemon.weight / 10,
    habilidades: pokemon.abilities.map(dato =>
      dato.ability.name.replace("-", " ")
    ),
    estadisticas: pokemon.stats.map(dato => ({
      nombre: nombresStats[dato.stat.name] || dato.stat.name,
      valor: dato.base_stat
    }))
  };
}

const formulario = document.querySelector("#search-form");
const campoBusqueda = document.querySelector("#pokemon-search");
const botonBuscar = document.querySelector("#search-button");
const mensaje = document.querySelector("#status-message");
const tarjeta = document.querySelector("#pokemon-card");

function crearEstadistica(estadistica) {
  const fila = document.createElement("div");
  fila.className = "stat-row";

  const etiqueta = document.createElement("span");
  etiqueta.textContent = estadistica.nombre;

  const valor = document.createElement("strong");
  valor.textContent = estadistica.valor;

  const barra = document.createElement("div");
  barra.className = "stat-bar";

  const progreso = document.createElement("span");
  progreso.style.width = `${Math.min(estadistica.valor, 255) / 255 * 100}%`;
  barra.append(progreso);

  const linea = document.createElement("div");
  linea.className = "stat-line";
  linea.append(etiqueta, valor);
  fila.append(linea, barra);
  return fila;
}

function mostrarPokemon(pokemon) {
  document.querySelector("#pokemon-number").textContent = `N.º ${pokemon.id}`;

  const imagen = document.querySelector("#pokemon-image");
  imagen.src = pokemon.imagen;
  imagen.alt = `Imagen de ${pokemon.nombre}`;

  document.querySelector("#pokemon-name").textContent = pokemon.nombre;
  document.querySelector("#pokemon-height").textContent = `${pokemon.altura} m`;
  document.querySelector("#pokemon-weight").textContent = `${pokemon.peso} kg`;
  document.querySelector("#pokemon-abilities").textContent = pokemon.habilidades.join(", ");

  const tipos = document.querySelector("#pokemon-types");
  tipos.replaceChildren();
  pokemon.tipos.forEach(tipo => {
    const etiqueta = document.createElement("span");
    etiqueta.className = "type-badge";
    etiqueta.textContent = tipo;
    tipos.append(etiqueta);
  });

  const estadisticas = document.querySelector("#pokemon-stats");
  estadisticas.replaceChildren();
  pokemon.estadisticas.forEach(estadistica => {
    estadisticas.append(crearEstadistica(estadistica));
  });

  tarjeta.hidden = false;
}

formulario.addEventListener("submit", async evento => {
  evento.preventDefault();
  botonBuscar.disabled = true;
  tarjeta.hidden = true;
  mensaje.textContent = "Buscando información...";
  mensaje.classList.remove("error-message");

  try {
    const pokemon = await consultarPokemon(campoBusqueda.value);
    mostrarPokemon(pokemon);
    mensaje.textContent = "Información cargada desde PokéAPI.";
  } catch (error) {
    mensaje.textContent = error.message;
    mensaje.classList.add("error-message");
  } finally {
    botonBuscar.disabled = false;
  }
});
