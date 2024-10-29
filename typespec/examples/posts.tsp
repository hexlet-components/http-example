const totalPostsExample = 40;

const skipPostsExample = 0;

const limitPostsExample = 40;

const newPostDtoExample = #{
  title: "New post",
  body: "New post body"
};

const editPostDtoExample = #{
  title: "Edited post",
  body: "Edited post body"
};

const postExample = #{
  id: "11",
  authorId: "1",
  title: "comitatus considero termes",
  body: "Cultura fuga adicio conforto. Dolorum curtus teneo sollicito. Vulpes truculenter capitulus.\nRepellat virtus reiciendis admiratio torqueo cubicularis tempore alii. Sustineo apud vorax amissio. Aestivus catena dolore quo antiquus tantillus vinculum talis desidero curia.\nIllum blanditiis concido tepidus talus laborum laudantium aequitas vilitas. Consuasor ago patria. Thermae crur amo."
};

const postsExample = #[
  postExample,
  #{
    id: "12",
    authorId: "1",
    title: "territo utrimque ab",
    body: "Spargo sponte tum rerum. Thymum comes concido taedium. Claustrum voluptas via armarium tremo decens nemo bellicus.\nChirographum auctor vehemens animi bardus acsi. Desino ullus aranea. Vestrum eos deleniti accendo capio aut sto xiphias.\nFacilis assumenda amplitudo deputo attero peccatus. Spes labore civis eligendi adduco cupiditas error. Vulariter considero repudiandae blanditiis tot unde."
  },
  #{
    id: "13",
    authorId: "1",
    title: "canonicus subseco ea",
    body: "Conventus optio tumultus aiunt. Cultura contabesco animi vitae vulticulus a. Quis avarus synagoga coniecto textor anser asper desipio.\nUlciscor deprimo autus auctor defessus sursum aro. Cursim carbo suffoco timor administratio atrocitas circumvenio. Vinculum crustulum debeo molestias demoror atqui denique fugiat repudiandae.\nAurum deinde quas officia. Virga allatus amicitia est claudeo credo. Triumphus capillus nam autus abscido."
  },
  #{
    id: "14",
    authorId: "1",
    title: "vulgivagus defleo succurro",
    body: "Perferendis coaegresco quia carcer conculco. Curvo casso balbus atrocitas adhaero urbs debeo stipes. Depono sopor cariosus derelinquo decipio repellat ullam cohaero.\nCompello antiquus careo uterque. Viduo laudantium appono subito attollo maxime cruciamentum abbas admoneo convoco. Angulus arcus cunae videlicet victoria.\nCorpus compono dolor sui ait soleo crinis. Ascit contego deserunt cohors vallum expedita civis ustilo versus. Brevis catena carus ipsam super."
  },
  #{
    id: "15",
    authorId: "1",
    title: "advoco decipio varietas",
    body: "Aufero cupiditate pariatur caecus tubineus pariatur vetus adsuesco appono viriliter. Paulatim dolores atqui dedecor velit tamquam strues virtus. Approbo constans video cui nemo mollitia dedico.\nFacere neque pectus delinquo correptius tabesco comis tres. Absorbeo laudantium placeat. Sophismata comptus carpo sumo vaco spero vespillo.\nAperio aranea aeternus defluo sursum delectatio. Conitor urbanus combibo dolore viduo cogo trepide tollo. Valde tres demo tum caecus taedium atrox audio adicio."
  },
  #{
    id: "16",
    authorId: "1",
    title: "aufero dolorum deleniti",
    body: "Asporto depromo vaco expedita bene aiunt pel commemoro. Attonbitus caries consequatur ustilo charisma textor cervus comptus. Sapiente sopor deinde coaegresco tumultus subseco aedificium.\nAstrum similique defero cicuta vox. Casso aeneus aranea asperiores arceo quos. Claudeo viridis suggero.\nOdit curis occaecati vae civitas vacuus pax cultura. Catena eius universe aspicio audentia curso. Tertius ver attero et corrigo bestia stips conculco."
  },
  #{
    id: "17",
    authorId: "1",
    title: "antiquus aetas beneficium",
    body: "Sodalitas vitiosus suasoria sursum amiculum paens. Ante ver aperte cunabula alioqui ago consectetur abundans. Adiuvo aiunt abeo cinis absens agnitio.\nPatior vilitas certus quod vitiosus virga carus. Curia credo casso sed adsuesco angustus tracto ante admitto. Harum argentum odit distinctio perferendis complectus contigo.\nNumquam apto accusamus. Summa valeo certe defleo spiculum vivo terror auctor cultellus aequitas. Amiculum non credo."
  },
  #{
    id: "18",
    authorId: "1",
    title: "solium absens summisse",
    body: "Demum spargo tactus ipsa deripio aer. Angelus curo comis absens. Fugiat clementia curto censura theologus delectatio.\nDefaeco territo considero id patior tego provident sursum curis trado. Autus vivo quisquam. Aequitas laudantium cavus sono defungo timidus apparatus aeternus.\nAsperiores solium atrocitas synagoga crur. Capto possimus adulescens a curis cupiditate stella id labore. Tamdiu absum angelus possimus derelinquo convoco maiores."
  },
  #{
    id: "19",
    authorId: "1",
    title: "appono deprimo decor",
    body: "Caste suppellex certus sequi maxime terror apparatus vado cras tabgo. Depopulo attero ago arguo curatio sumo deorsum odio. Tracto alii velit usus audax aurum suus comparo sono.\nTardus ventosus demens exercitationem. Causa statua tumultus. Suppellex debilito abscido perspiciatis accedo.\nAuditor sophismata demonstro iure vester denuo cohors. Depraedor conqueror audax alo vacuus. Vesper subito tracto aut cattus aranea."
  },
  #{
    id: "20",
    authorId: "1",
    title: "volubilis aliquam coma",
    body: "Corpus verbum argumentum caste. Perspiciatis solutio vis vulgivagus possimus vero modi ater templum voro. Claustrum molestiae toties neque turpis eveniet conatus.\nCena sint peior ea bibo. Approbo dolor demum. Collum illum admoveo trucido.\nArgentum alius molestias aperiam subito arma. Succurro stips vero cur earum cavus dedico. Ancilla corona aegrotatio absens."
  },
  #{
    id: "21",
    authorId: "2",
    title: "demonstro calco demens",
    body: "Enim brevis copiose accusamus depono. Tristis aduro adamo utrimque. Ubi compono quidem autem.\nCruciamentum venio caput sufficio decet sit aequus subvenio. Commodi templum explicabo verbum optio totus spiritus nostrum auctor decerno. Turba deleo adhaero sequi illo cumque arca corrupti.\nConfugo curo est universe vix usitas tepidus inventore. Quasi surculus caveo vester sordeo autem. Quos creta cupio."
  },
  #{
    id: "22",
    authorId: "2",
    title: "absconditus quod coma",
    body: "Repudiandae aperiam expedita infit. Arma amoveo cito ars sui cinis cetera suppono strues. Paens inflammatio barba constans vinum sumo thalassinus.\nCursim timidus claustrum calculus comedo comis accusantium vos voluptates absque. Ratione enim abscido patior aureus molestiae vigilo cohibeo impedit repudiandae. Altus adfectus optio depopulo vesco altus.\nAttollo contra canto reprehenderit trucido abundans bardus tactus urbs. Decumbo ubi voluptates sollicito super ipsa. Teneo tenus corroboro abstergo terminatio statim cresco cupio compello."
  },
  #{
    id: "23",
    authorId: "2",
    title: "verto cervus texo",
    body: "Totidem urbs deinde acidus maiores. Crudelis beatae aduro verus succedo. Aut agnosco doloremque pecus collum adulatio viscus praesentium.\nTemporibus video pax crepusculum conservo soluta corroboro coniuratio demoror vis. Cauda amaritudo casso arcus astrum at suadeo teres cultellus. Anser suspendo deserunt defungo.\nVestrum abscido eveniet. Clamo coruscus dignissimos trans vomito canonicus sto sonitus. Cruentus dolorem adfectus accedo abduco vapulus comedo."
  },
  #{
    id: "24",
    authorId: "2",
    title: "valens pecus terra",
    body: "Impedit deludo alter contabesco absque comprehendo eum curis. Auxilium correptius synagoga desidero cometes commodi alveus crustulum alii versus. Vicinus alveus curriculum tempora teneo asporto.\nAedificium thymbra supra utrimque atqui vulgaris. Demergo super asporto blandior. Currus voro vestigium testimonium ceno.\nTolero tondeo adiuvo constans ascit. Audacia custodia bellicus. Optio cibo modi defaeco alias accedo."
  },
  #{
    id: "25",
    authorId: "2",
    title: "volubilis audax aufero",
    body: "Conatus suus cimentarius placeat aedificium. Clementia ago umerus abduco. Aequitas cauda tutis decor cauda atque vel contabesco censura.\nAverto teres stipes. Adsidue consequatur sperno pax condico clamo tametsi minus ubi comis. Beatae claudeo usitas sufficio.\nAstrum saepe advoco creo sonitus ventus. Thymum defero temporibus canto adinventitias. Somnus defungo adversus cometes."
  },
  #{
    id: "26",
    authorId: "2",
    title: "constans talio canonicus",
    body: "Sed trado atrocitas. Absconditus bis apparatus facilis cavus suscipio amo depromo. Ambulo aegrus ea civis adicio in caelestis decor.\nVirga adversus dapifer. Curatio tam uxor argentum. Aegrus utrum succurro strenuus cetera tardus quas volaticus canonicus.\nMolestias truculenter undique. Varietas aptus apto conventus tubineus veritatis virga canis amplexus. Spoliatio explicabo totidem."
  },
  #{
    id: "27",
    authorId: "2",
    title: "comitatus vergo crepusculum",
    body: "Summa ante cras. Deduco usque vita valetudo ait thesaurus cubitum cena. Arma campana ara tabgo uterque agnitio iure.\nDenuo alter decens cotidie appono coerceo ascit. Ullus aureus cresco conventus corrupti tergiversatio. Voco velum cetera chirographum adhuc itaque villa demonstro hic.\nCattus bene demergo tredecim nostrum ante suffragium cribro temptatio. Atavus error terebro. Studio creta demens sum."
  },
  #{
    id: "28",
    authorId: "2",
    title: "mollitia carpo vestigium",
    body: "Tero celer tamdiu synagoga umbra delicate caritas cursim vae sordeo. Coniuratio tergum cito. Aestivus tot virgo crapula arceo aspicio colo vereor terra.\nAggero dicta repellendus conor decor. Patruus consuasor ventus. Talis ipsum anser correptius video cohibeo cuius thorax timidus expedita.\nAdmoveo similique thorax amplus dolorum. Temeritas accusator dolor volaticus ab arbustum defluo sordeo. Appello benevolentia consequatur approbo infit amaritudo."
  },
  #{
    id: "29",
    authorId: "2",
    title: "uberrime trepide aranea",
    body: "Verecundia tergiversatio antepono soluta aetas viscus paens carbo. Tubineus triduana carpo ex vinco corona brevis. Vesica bene vilitas tero thermae et voluptatem titulus.\nCrebro demonstro succurro. Decimus ait delibero super barba corona sol enim. Volo sequi tardus maxime adhuc administratio tenax temperantia calco facere.\nSufficio vetus tendo. Talio amicitia combibo compono carmen vix. Tabernus deserunt texo cunae eaque abundans."
  },
  #{
    id: "30",
    authorId: "2",
    title: "cultellus urbs victus",
    body: "Cum infit similique averto templum. Appello decumbo suffoco facilis aggredior unus careo aeger convoco volaticus. Demo torqueo vestrum infit tui teres vergo.\nTres angulus natus patior harum. Solum aeger verecundia benigne. Derelinquo utroque saepe voco decens.\nVivo comprehendo caelum alo sto aperte quos vestrum desparatus civitas. Ullam ago absens. Animadverto libero uberrime ducimus candidus spiculum cui temporibus damno talus."
  },
  #{
    id: "31",
    authorId: "3",
    title: "labore auctor sumptus",
    body: "Cohors curia campana congregatio. Constans timidus dolores auxilium vel apparatus summisse. Vapulus adhuc voro sophismata abundans temptatio dapifer decumbo.\nUsque quidem sollicito. Vestrum sol voro. Blanditiis uberrime sufficio titulus annus ater eum thesis animadverto quia.\nUstilo cotidie vulnus. Thesaurus desino ultra crastinus stipes sol torrens spectaculum. Ciminatio cursim aperio credo arma cohibeo."
  },
  #{
    id: "32",
    authorId: "3",
    title: "doloremque maxime autus",
    body: "Curiositas dolore casus cohors tui annus coerceo dolore delego. Demoror constans contabesco aedificium ceno. Quos thymbra censura deprimo desidero celo absque nulla.\nCohaero tristis hic absens provident commodi utilis bonus voro infit. Temeritas cerno communis succurro adinventitias surculus voluntarius vivo sulum. Trans ipsum abscido turbo deficio colo quisquam ascit uterque candidus.\nUstilo accommodo traho bene. Tabernus decet correptius succedo deprimo. Tamquam somniculosus circumvenio damnatio arceo degero assentator."
  },
  #{
    id: "33",
    authorId: "3",
    title: "perferendis absque deludo",
    body: "Facere vito vitae speciosus sublime ante. Amicitia aiunt xiphias aperte. Dedecor universe acsi cursus derideo decumbo quia consequatur comis.\nTendo denuncio vinitor acer vindico spectaculum velit apto. Numquam spoliatio avaritia aveho absque tenus. Eum vergo defendo coadunatio occaecati succurro solus vindico talus suppono.\nNatus caveo capto valetudo collum absens. Cernuus conservo claro conservo conforto quis conculco vitium volutabrum. Aqua veniam torrens adaugeo."
  },
  #{
    id: "34",
    authorId: "3",
    title: "incidunt blandior amplus",
    body: "Triduana defendo coaegresco dolorem suus repellat. Arca qui acsi denuo sui. Natus decumbo vacuus tabgo cilicium territo.\nStipes solus debilito ex auditor cunctatio laudantium vigor omnis. Vinum laudantium adeo vacuus. Vulgo timor vacuus sopor clamo qui accommodo.\nAtrocitas somniculosus tergum voro bardus aeger casus apto. Beatae uredo aggredior tamquam. Vergo thesaurus veritatis laboriosam calcar possimus aliquid."
  },
  #{
    id: "35",
    authorId: "3",
    title: "clarus velut spero",
    body: "Arx cena volutabrum adfectus uredo non defendo arcus. Caput desparatus attero sortitus acceptus provident traho nostrum curtus adsum. Textilis defaeco anser corona statim adsum tego corpus curriculum.\nUtilis delibero cubo. Torrens benigne culpo adduco dolor. Molestias defendo cohors amitto advoco perspiciatis advenio valde congregatio vaco.\nIllum appello fuga arx abstergo solitudo aggero. Aureus vesper sono attero. Labore video cervus eius vilicus sperno copia sopor creptio eos."
  },
  #{
    id: "36",
    authorId: "3",
    title: "tandem rem occaecati",
    body: "Vacuus absum sodalitas aliquid eligendi suggero. Antea vallum vigilo subvenio aperte accommodo. Abutor cornu charisma vos deleo tener appositus.\nEos creptio coruscus avaritia crur uredo demum sopor caput. Corona atrocitas aranea coepi. Aptus claudeo derideo torrens cupio aiunt suadeo.\nAgo tergo catena iure adduco excepturi. Amo conturbo aiunt tenetur delectatio contabesco vobis crur. Decretum depromo vox spectaculum vigilo ars annus aro cribro."
  },
  #{
    id: "37",
    authorId: "3",
    title: "explicabo candidus cetera",
    body: "Supellex absque tumultus amo compello tui cibus conor. Coruscus attonbitus tredecim crur cruentus adficio vulticulus teres. Optio beneficium vel aptus.\nAdstringo tertius audentia. Damnatio ambulo cunctatio verus supra defetiscor vitiosus socius conturbo. Succurro causa acidus suasoria civitas tam solutio crinis adopto.\nAdhaero tardus architecto sui venustas comparo votum. Caute venia voluptas vulariter somniculosus. Absum aequus tenus arcus caste."
  },
  #{
    id: "38",
    authorId: "3",
    title: "unde creo sapiente",
    body: "Stultus atrocitas conicio delinquo adicio tametsi socius canto decretum. Voluntarius aeger una quod. Absconditus decor cultellus caput annus talis occaecati tracto antea animi.\nAdulescens earum decet verbum usque defendo sint tempore. Coruscus peccatus aegre teres denuo natus denique. Turbo alius cumque unus subiungo voluptatibus defessus.\nAdmitto distinctio solio conitor adeo admoveo cupio consequuntur terreo. Perspiciatis valeo eligendi. Cras patior trado angustus."
  },
  #{
    id: "39",
    authorId: "3",
    title: "paens dolores claustrum",
    body: "Umerus antiquus torqueo ratione totus celo aliquam abbas strenuus. Ratione commemoro acsi iste statim. Canis caste talio.\nAmbitus accusantium bos aetas caute voco celo defleo cervus utpote. Tandem copiose vomica aestas possimus arbitro decimus patior adeo candidus. Confero decerno adulescens tot tricesimus conqueror demitto cupio uredo thermae.\nVerbera cubitum officiis tantum validus compello arbustum perferendis usitas. Patria currus venia desparatus cupio substantia absconditus adfectus. Cinis umerus sulum tametsi."
  },
  #{
    id: "40",
    authorId: "3",
    title: "vere desolo admitto",
    body: "Bestia catena tubineus velociter non. Debilito beatus neque condico vel magni. Commodi rem tibi vado.\nDeputo possimus utor ciminatio comprehendo cornu explicabo auxilium vita. Adversus vito ventus. Soleo audentia soluta clibanus advoco vere vestigium.\nDesipio ullam cunae brevis amita tergum ab cunae clibanus cariosus. Curia vix timidus ambulo claustrum titulus. Thema est commemoro desolo sed magni suspendo assumenda."
  }
];
