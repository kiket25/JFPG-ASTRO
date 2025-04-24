/**
 * @SofiDev Esto es JSDOC, si consideras que puede ser complicado solo borralo, es un comentario, no afectará en nada
 * @typedef PortafolioData
 * @property {string} imgSrc Url de la imagen
 * @property {string} title Titulo de la tarjeta
 * @property {string[]} skills Array con tus habilidades ej: ['React', 'CSS', 'JavaScript']
 * @property {string} descripcion La descripcion de la tarjeta
 * @property {string} demoURL Url de una pagina de demostración
 * @property {string} repoURL Url del repositorio, ej: https://github.com/usuario/repo
 * @property {string} anim La animación que se ejecutará cuando se cargue la tarjeta, ej: fade-up, fade-right, fade-left, fade-down
 * @property {number} averageBrightness Cuanto brillo tendrá el color de fondo de la tarjeta, ej: 0.1
 */

/**
 * @SofiDev Esto es JSDOC, si consideras que puede ser complicado solo borralo, es un comentario, no afectará en nada
 * @type {PortafolioData[]}
 */
export const portafolioData = [
	{
		imgSrc: 'img/picadilly.png',
		title: 'Picadilly',
		skills: ['Burp Suite', 'Web Exploitation'],
		descripcion:
			'Reto de ciberseguridad centrado en la explotación de vulnerabilidades web a través de técnicas como SQLi, LFI y bypass de autenticación. Enfocado en análisis con Burp.',
		demoURL: '',
		repoURL: 'https://github.com/kiket25/Write-Ups/blob/main/picadilly-writeup.pdf',
		anim: 'fade-up',
	},
	{
		imgSrc: 'img/stranger.png',
		title: 'Stranger',
		skills: ['OSINT', 'Linux', 'Reversing'],
		descripcion:
			'Un reto .',
		demoURL: '',
		repoURL: '',
		anim: 'fade-left',
	},
	{
		imgSrc: 'img/paradise.png',
		title: 'Paradise',
		skills: ['OSINT', 'Linux', 'Reversing'],
		descripcion:
			'Un reto con enfoque narrativo donde el análisis forense, el reconocimiento pasivo y técnicas de ingeniería inversa se mezclan en una historia misteriosa.',
		demoURL: '',
		repoURL: 'https://github.com/kiket25/Write-Ups/blob/main/Paradise-writeup.pdf',
		anim: 'fade-left',
	},
	{
		imgSrc: 'img/devil.png',
		title: 'Devil',
		skills: ['Privilege Escalation', 'Network Pivoting'],
		descripcion:
			'Desafío técnico avanzado que simula una red industrial comprometida. Requiere pivoting, explotación de servicios y escalada hasta acceso root.',
		demoURL: '',
		repoURL: 'https://github.com/kiket25/Write-Ups/blob/main/devil.pdf',
		anim: 'fade-right',
	}
];

const skillIcons = {
	JavaScript: 'skill-icons:javascript',
	React: 'skill-icons:react-dark',
	Astro: 'skill-icons:astro',
	CSS: 'skill-icons:css',
	Sass: 'skill-icons:sass',
	StyledComponents: 'skill-icons:styledcomponents',
	Bootstrap: 'skill-icons:bootstrap',
	Tailwind: 'skill-icons:tailwindcss-dark',
};

/**
 * @description Se mapea el portafolioData para que tenga los iconos de las habilidades
 * 	Puedes ver Array.map en https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
 */
export const getPortafolioData = portafolioData.map((item) => {
	return {
		// Se coloca todo el contenido previo del item
		...item,
		// Se cambian las skills por los iconos correspondientes
		skills: item.skills.map((skill) => skillIcons[skill]),
	};
});
