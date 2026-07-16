<h1>Protección de Rutas</h1>
En esta rama se implemento la proteccion de rutas con el objetivo de garantizar que unicamente los usuarios autenticados y con los permisos adecuados puedan acceder a las funcionalidades correspondientes a su rol en el sistema de reservas 
<h3>Beneficios</h3>

* Mayor seguridad 
* Protección de información 
* Prevención de accesos no autorizados 
* Separación clara entre rutas públicas y privadas 

<h3>Proteger rutas en el frontend y el backend</h3>

<strong>Frontend</strong>

* Controla que paginas se pueden visualizar
* Mejora la experiencia de navegacion 
* Redireccion al login cuando no hay sesion 




<strong>Backend </strong>

* Garantiza la seguridad de los datos 
* No puede ser omitido si esta correctamente implementado 
* Rechaza solicitudes sin autenticación

Se deben proteger ambos ya que un usuario podria intentar acceder directamnete a la API usando herramientas como Postman, por eso la validacion en el backend es la capa de seguridad principal, mientras que la de frontend mejora la navegacion y experiencia del usuario. 
