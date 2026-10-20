// Three invented properties and guests. Each has a saved model read, so the app works without a key.

const base = {
  autonomy: 'balanced',
  promises: ['money', 'timing', 'guests', 'change'],
  hostLangs: ['English', 'Spanish']
};

export const EXAMPLES = [
  {
    id: 'wifi',
    sector: 'Routine',
    title: 'Wifi, parking and tapas',
    blurb: 'A settled guest asks three things the house facts already answer. Try it on Cautious to see the lane move.',
    form: {
      ...base,
      property: 'Casa Azahar, Málaga old town',
      channel: 'Airbnb',
      stage: 'In the stay',
      time: 'Evening',
      calendar: ['Free nights either side'],
      message: "Hi! We're settled in, the flat is lovely. Two quick things: what's the wifi password again, and is there anywhere to park a car overnight nearby? Also, any tapas bar you'd recommend within walking distance? Thanks, Laura",
      facts: "Wifi network: CasaAzahar_5G, password: naranja2024.\nParking: the flat has no private parking. The nearest public car park is Parking Calle Pinos, about 4 minutes on foot, open 24 hours.\nCheck-out is at 11:00. Bins go in the containers at the end of the street after 20:00.\nOur favourite tapas bar nearby is Bodega La Esquina, 6 minutes' walk, best to arrive before 20:30.\nQuiet hours from 23:00."
    },
    text: [
      'SUMMARY|A settled guest asks for the wifi password, somewhere to park overnight and a tapas bar nearby, all covered by the house facts.',
      'LANG|English',
      "ASK|house|The wifi password|what's the wifi password again",
      'ASK|house|Somewhere to park overnight|is there anywhere to park a car overnight nearby',
      "ASK|local|A tapas bar within walking distance|any tapas bar you'd recommend within walking distance",
      'FACT|Wifi network: CasaAzahar_5G, password: naranja2024',
      'FACT|the flat has no private parking. The nearest public car park is Parking Calle Pinos, about 4 minutes on foot, open 24 hours',
      "FACT|Our favourite tapas bar nearby is Bodega La Esquina, 6 minutes' walk, best to arrive before 20:30",
      'REPLY|Hi Laura, so glad you like the flat!',
      'REPLY|The wifi is CasaAzahar_5G and the password is naranja2024.',
      'REPLY|There is no private parking, but Parking Calle Pinos is about 4 minutes on foot and open 24 hours.',
      "REPLY|For tapas, our favourite is Bodega La Esquina, 6 minutes' walk. It fills up, so try to arrive before 20:30.",
      'REPLY|Enjoy your evening!',
      'HOLD|Hi Laura, thanks for your message. I will get back to you shortly.'
    ].join('\n')
  },
  {
    id: 'early',
    sector: 'Needs the host',
    title: 'Early arrival, a dog and a discount',
    blurb: 'A guest writing in Spanish asks for three things only the host can agree, on a day with a turnover.',
    form: {
      ...base,
      property: 'Ático Malagueta',
      channel: 'Booking.com',
      stage: 'Booked, before arrival',
      time: 'Daytime',
      calendar: ['Another guest leaves on their arrival day'],
      message: 'Hola, llegamos el viernes en el tren de las 10:15. ¿Podríamos entrar al piso sobre las 11:00? También queríamos saber si podemos llevar a nuestra perrita, es pequeña y muy tranquila. Y si nos quedamos dos noches más, ¿nos haríais algún descuento? Gracias, Javier',
      facts: 'Check-in from 16:00, check-out by 11:00.\nLuggage can be left in the storage room from 12:00 on arrival day. The host sends the storage code on the morning of arrival.\nThe flat sleeps 4 in two bedrooms.\nNearest train station: María Zambrano, about 15 minutes by taxi.\nThe beach is 3 minutes on foot.'
    },
    text: [
      'SUMMARY|A guest arriving on Friday asks to get in at 11:00, to bring a small dog and for a discount on two extra nights.',
      'LANG|Spanish',
      'ASK|timing|To get into the flat at about 11:00|¿Podríamos entrar al piso sobre las 11:00?',
      'ASK|guests|To bring a small dog|si podemos llevar a nuestra perrita',
      'ASK|money|A discount for two extra nights|si nos quedamos dos noches más, ¿nos haríais algún descuento?',
      'FACT|Check-in from 16:00, check-out by 11:00',
      'FACT|Luggage can be left in the storage room from 12:00 on arrival day',
      'GAP|Whether pets are allowed',
      'REPLY|Hola Javier, ¡gracias por escribir!',
      'REPLY|El check-in es a partir de las 16:00. Si llegáis antes, podéis dejar el equipaje en el trastero desde las 12:00.',
      'REPLY|Lo de entrar antes, la perrita y las dos noches más lo consulto con el anfitrión y te confirmo hoy.',
      'REPLY|¡Un saludo!',
      'HOLD|Hola Javier, gracias por tu mensaje. Consulto lo de la hora de llegada, la perrita y las noches extra con el anfitrión y te respondo hoy mismo.'
    ].join('\n')
  },
  {
    id: 'gas',
    sector: 'Emergency',
    title: 'A gas smell at night',
    blurb: 'Children asleep and a gas smell, on Hands-off. The word list and the model both catch it, and nothing the model wrote is sent.',
    form: {
      ...base,
      autonomy: 'handsoff',
      property: 'Villa Los Olivos, Mijas',
      channel: 'Direct booking',
      stage: 'In the stay',
      time: 'Night, 23:00 to 08:00',
      calendar: ['Free nights either side'],
      message: "Sorry to message so late. There's a strong smell of gas in the kitchen since we came back from dinner. The kids are asleep upstairs. Should we open the windows? Also the pool lights don't switch on, but that can wait. Pieter",
      facts: 'Gas: the hob runs on a butane bottle in the cupboard under the sink. The valve is the red lever on top of the bottle.\nEmergency number in Spain: 112.\nPool lights: switch on the panel by the back door, labelled PISCINA.\nThe host mobile for anything urgent is on the first page of the welcome folder.'
    },
    text: [
      'SUMMARY|A guest reports a strong gas smell in the kitchen at night with children asleep upstairs, and pool lights that will not switch on.',
      'LANG|English',
      "ASK|problem|What to do about a gas smell in the kitchen|There's a strong smell of gas in the kitchen",
      "ASK|problem|The pool lights will not switch on|the pool lights don't switch on",
      "SIGNAL|safety|There's a strong smell of gas in the kitchen|A gas smell with children asleep inside is a danger to life.",
      'FACT|The valve is the red lever on top of the bottle',
      'FACT|Emergency number in Spain: 112',
      'FACT|Pool lights: switch on the panel by the back door, labelled PISCINA',
      'REPLY|Hi Pieter, please get everyone out of the house now and do not switch anything on or off.',
      'REPLY|If it is safe, close the red lever on top of the gas bottle under the sink. Call 112 if the smell is strong.',
      'REPLY|The pool lights switch on at the panel by the back door, labelled PISCINA. That can wait until tomorrow.',
      'HOLD|Hi Pieter, I have seen your message and the host is calling you now.'
    ].join('\n')
  }
];
