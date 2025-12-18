/*
  # Seed All Hotel Zones

  Populates the hotel_zones table with all hotels across 5 transfer zones.
  Each hotel includes search terms for fuzzy matching in the chat system.

  ## Zone Breakdown
  - Zone A (Bavaro / Punta Cana): 28 hotels
  - Zone B (Cap Cana): 7 hotels
  - Zone C (Uvero Alto / Macao): 8 hotels
  - Zone D (Bayahibe / La Romana): 7 hotels
  - Zone E (Santo Domingo): 8 hotels

  Total: 58 hotels
*/

-- ZONE A – Punta Cana / Bávaro (28 hotels)
INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, is_active) VALUES
  ('Hard Rock Hotel Punta Cana', 'Zone A', 'Bavaro / Punta Cana', ARRAY['hard rock', 'hard rock punta cana', 'hard rock hotel'], true),
  ('Royalton Bavaro', 'Zone A', 'Bavaro / Punta Cana', ARRAY['royalton bavaro', 'royalton'], true),
  ('Royalton Punta Cana', 'Zone A', 'Bavaro / Punta Cana', ARRAY['royalton punta cana', 'royalton'], true),
  ('Majestic Mirage', 'Zone A', 'Bavaro / Punta Cana', ARRAY['majestic mirage', 'mirage'], true),
  ('Majestic Colonial', 'Zone A', 'Bavaro / Punta Cana', ARRAY['majestic colonial', 'colonial'], true),
  ('Majestic Elegance', 'Zone A', 'Bavaro / Punta Cana', ARRAY['majestic elegance', 'elegance'], true),
  ('Barceló Bávaro Palace', 'Zone A', 'Bavaro / Punta Cana', ARRAY['barcelo bavaro palace', 'barceló bavaro palace', 'barcelo palace'], true),
  ('Barceló Bávaro Beach', 'Zone A', 'Bavaro / Punta Cana', ARRAY['barcelo bavaro beach', 'barceló bavaro beach', 'barcelo beach'], true),
  ('RIU Palace Bavaro', 'Zone A', 'Bavaro / Punta Cana', ARRAY['riu palace bavaro', 'riu bavaro'], true),
  ('RIU Palace Punta Cana', 'Zone A', 'Bavaro / Punta Cana', ARRAY['riu palace punta cana', 'riu punta cana'], true),
  ('RIU Republica', 'Zone A', 'Bavaro / Punta Cana', ARRAY['riu republica', 'republica'], true),
  ('Paradisus Palma Real', 'Zone A', 'Bavaro / Punta Cana', ARRAY['paradisus palma real', 'palma real'], true),
  ('Paradisus Grand Cana', 'Zone A', 'Bavaro / Punta Cana', ARRAY['paradisus grand cana', 'grand cana'], true),
  ('Melia Caribe Beach', 'Zone A', 'Bavaro / Punta Cana', ARRAY['melia caribe', 'meliá caribe', 'melia caribe beach'], true),
  ('Melia Punta Cana', 'Zone A', 'Bavaro / Punta Cana', ARRAY['melia punta cana', 'meliá punta cana'], true),
  ('Lopesan Costa Bávaro', 'Zone A', 'Bavaro / Punta Cana', ARRAY['lopesan', 'lopesan costa bavaro', 'lopesan bavaro'], true),
  ('Secrets Royal Beach', 'Zone A', 'Bavaro / Punta Cana', ARRAY['secrets royal beach', 'secrets royal'], true),
  ('Dreams Royal Beach', 'Zone A', 'Bavaro / Punta Cana', ARRAY['dreams royal beach', 'dreams royal'], true),
  ('Occidental Punta Cana', 'Zone A', 'Bavaro / Punta Cana', ARRAY['occidental', 'occidental punta cana'], true),
  ('Iberostar Selection Bavaro', 'Zone A', 'Bavaro / Punta Cana', ARRAY['iberostar bavaro', 'iberostar selection'], true),
  ('Bahia Principe Fantasia', 'Zone A', 'Bavaro / Punta Cana', ARRAY['bahia principe', 'fantasia'], true),
  ('TRS Turquesa', 'Zone A', 'Bavaro / Punta Cana', ARRAY['trs turquesa', 'turquesa'], true),
  ('Grand Palladium Bavaro', 'Zone A', 'Bavaro / Punta Cana', ARRAY['grand palladium', 'palladium bavaro'], true),
  ('Ocean Blue & Sand', 'Zone A', 'Bavaro / Punta Cana', ARRAY['ocean blue', 'ocean blue sand'], true),
  ('Vista Sol Punta Cana', 'Zone A', 'Bavaro / Punta Cana', ARRAY['vista sol', 'vista sol punta cana'], true),
  ('Impressive Punta Cana', 'Zone A', 'Bavaro / Punta Cana', ARRAY['impressive', 'impressive punta cana'], true),
  ('Los Corales', 'Zone A', 'Bavaro / Punta Cana', ARRAY['los corales', 'corales'], true),
  ('Ducassi Suites', 'Zone A', 'Bavaro / Punta Cana', ARRAY['ducassi', 'ducassi suites'], true);

-- ZONE B – Cap Cana (7 hotels)
INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, is_active) VALUES
  ('Sanctuary Cap Cana', 'Zone B', 'Cap Cana', ARRAY['sanctuary', 'sanctuary cap cana'], true),
  ('Hyatt Zilara Cap Cana', 'Zone B', 'Cap Cana', ARRAY['hyatt zilara', 'zilara', 'hyatt zilara cap cana'], true),
  ('Hyatt Ziva Cap Cana', 'Zone B', 'Cap Cana', ARRAY['hyatt ziva', 'ziva', 'hyatt ziva cap cana'], true),
  ('Eden Roc Cap Cana', 'Zone B', 'Cap Cana', ARRAY['eden roc', 'eden roc cap cana'], true),
  ('TRS Cap Cana', 'Zone B', 'Cap Cana', ARRAY['trs cap cana', 'trs'], true),
  ('Secrets Cap Cana', 'Zone B', 'Cap Cana', ARRAY['secrets cap cana', 'secrets'], true),
  ('Dreams Cap Cana', 'Zone B', 'Cap Cana', ARRAY['dreams cap cana', 'dreams'], true);

-- ZONE C – Uvero Alto / Macao (8 hotels)
INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, is_active) VALUES
  ('Dreams Macao Beach', 'Zone C', 'Uvero Alto', ARRAY['dreams macao', 'macao beach'], true),
  ('Royalton Splash', 'Zone C', 'Uvero Alto', ARRAY['royalton splash', 'splash'], true),
  ('Nickelodeon Resort', 'Zone C', 'Uvero Alto', ARRAY['nickelodeon', 'nickelodeon resort'], true),
  ('Finest Punta Cana', 'Zone C', 'Uvero Alto', ARRAY['finest', 'finest punta cana'], true),
  ('Excellence Punta Cana', 'Zone C', 'Uvero Alto', ARRAY['excellence', 'excellence punta cana'], true),
  ('Breathless Punta Cana', 'Zone C', 'Uvero Alto', ARRAY['breathless', 'breathless punta cana'], true),
  ('Zoëtry Agua', 'Zone C', 'Uvero Alto', ARRAY['zoetry', 'zoetry agua', 'zoëtry agua'], true),
  ('Live Aqua Punta Cana', 'Zone C', 'Uvero Alto', ARRAY['live aqua', 'aqua'], true);

-- ZONE D – Bayahibe / La Romana (7 hotels)
INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, is_active) VALUES
  ('Dreams Dominicus', 'Zone D', 'Bayahibe', ARRAY['dreams dominicus', 'dominicus'], true),
  ('Sunscape Dominicus', 'Zone D', 'Bayahibe', ARRAY['sunscape', 'sunscape dominicus'], true),
  ('Hilton La Romana', 'Zone D', 'Bayahibe', ARRAY['hilton', 'hilton la romana'], true),
  ('Iberostar Hacienda Dominicus', 'Zone D', 'Bayahibe', ARRAY['iberostar hacienda', 'hacienda dominicus'], true),
  ('Catalonia Royal La Romana', 'Zone D', 'Bayahibe', ARRAY['catalonia', 'catalonia royal'], true),
  ('Casa de Campo', 'Zone D', 'Bayahibe', ARRAY['casa de campo', 'casa campo'], true),
  ('Viva Wyndham Dominicus', 'Zone D', 'Bayahibe', ARRAY['viva wyndham', 'wyndham dominicus'], true);

-- ZONE E – Santo Domingo City (8 hotels)
INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, is_active) VALUES
  ('JW Marriott Santo Domingo', 'Zone E', 'Santo Domingo', ARRAY['jw marriott', 'marriott', 'jw marriott santo domingo'], true),
  ('Intercontinental Real', 'Zone E', 'Santo Domingo', ARRAY['intercontinental', 'intercontinental real'], true),
  ('Barceló Santo Domingo', 'Zone E', 'Santo Domingo', ARRAY['barcelo santo domingo', 'barceló santo domingo'], true),
  ('Sheraton Santo Domingo', 'Zone E', 'Santo Domingo', ARRAY['sheraton', 'sheraton santo domingo'], true),
  ('El Embajador Royal Hideaway', 'Zone E', 'Santo Domingo', ARRAY['el embajador', 'embajador', 'royal hideaway'], true),
  ('Hodelpa Nicolas de Ovando', 'Zone E', 'Santo Domingo', ARRAY['hodelpa', 'nicolas de ovando', 'hodelpa nicolas'], true),
  ('Billini Hotel', 'Zone E', 'Santo Domingo', ARRAY['billini', 'billini hotel'], true),
  ('Aloft Santo Domingo', 'Zone E', 'Santo Domingo', ARRAY['aloft', 'aloft santo domingo'], true);