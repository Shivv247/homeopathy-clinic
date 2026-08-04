/**
 * Generates repertory-extended.json — run: node scripts/generate-repertory-extended.js
 * Merges with base repertory.json for 400+ clinical rubrics.
 */
const fs = require('fs');
const path = require('path');

const R = (id, chapter, rubric, remedies) => ({
  id,
  chapter,
  rubric,
  remedies: remedies.map(([name, grade]) => ({ name, grade })),
});

const extended = [
  // ── Mind (extended) ──
  R('r081', 'Mind', 'ANGER, violent', [['Staphysagria', 4], ['Chamomilla', 3], ['Nux Vomica', 3]]),
  R('r082', 'Mind', 'ANGER, suppressed', [['Staphysagria', 4], ['Natrum Muriaticum', 3], ['Lycopodium Clavatum', 2]]),
  R('r083', 'Mind', 'DELUSIONS, imaginations', [['Hyoscyamus Niger', 3], ['Anacardium Orientale', 3], ['Stramonium', 3]]),
  R('r084', 'Mind', 'DELUSIONS, persecuted', [['Hyoscyamus Niger', 4], ['Lachesis Mutus', 3], ['Anacardium Orientale', 2]]),
  R('r085', 'Mind', 'DESPAIR', [['Arsenicum Album', 3], ['Aurum Metallicum', 4], ['Natrum Muriaticum', 2]]),
  R('r086', 'Mind', 'FEAR, crowd, in a', [['Argentum Nitricum', 4], ['Gelsemium', 3], ['Lycopodium Clavatum', 2]]),
  R('r087', 'Mind', 'FEAR, dark', [['Stramonium', 4], ['Calcarea Carbonica', 3], ['Phosphorus', 2]]),
  R('r088', 'Mind', 'FEAR, disease, of', [['Arsenicum Album', 4], ['Nitricum Acidum', 3], ['Kali Arsenicosum', 2]]),
  R('r089', 'Mind', 'FEAR, failure, of', [['Lycopodium Clavatum', 4], ['Argentum Nitricum', 3], ['Gelsemium', 2]]),
  R('r090', 'Mind', 'FEAR, ghosts, of', [['Phosphorus', 3], ['Stramonium', 3], ['Pulsatilla Nigricans', 2]]),
  R('r091', 'Mind', 'FEAR, high places', [['Argentum Nitricum', 4], ['Gelsemium', 2], ['Phosphorus', 2]]),
  R('r092', 'Mind', 'FEAR, thunderstorm', [['Phosphorus', 4], ['Rhododendron', 3], ['Borax', 2]]),
  R('r093', 'Mind', 'FORGETFULNESS', [['Anacardium Orientale', 3], ['Lycopodium Clavatum', 3], ['Natrum Muriaticum', 2]]),
  R('r094', 'Mind', 'HURRIED', [['Argentum Nitricum', 3], ['Nux Vomica', 2], ['Lilium Tigrinum', 2]]),
  R('r095', 'Mind', 'IMPULSIVE', [['Nux Vomica', 3], ['Hyoscyamus Niger', 3], ['Tarentula Hispanica', 2]]),
  R('r096', 'Mind', 'IRRITABILITY, trifles, about', [['Chamomilla', 4], ['Nux Vomica', 3], ['Ignatia Amara', 2]]),
  R('r097', 'Mind', 'LAZINESS', [['Sulphur', 3], ['Sepia Officinalis', 2], ['Calcarea Carbonica', 2]]),
  R('r098', 'Mind', 'MANIA, religious', [['Stramonium', 3], ['Veratrum Album', 3], ['Hyoscyamus Niger', 2]]),
  R('r099', 'Mind', 'MELANCHOLY', [['Natrum Muriaticum', 3], ['Aurum Metallicum', 4], ['Ignatia Amara', 2]]),
  R('r100', 'Mind', 'MOOD, changeable', [['Pulsatilla Nigricans', 4], ['Ignatia Amara', 3], ['Crocus Sativus', 2]]),
  R('r101', 'Mind', 'OBSTINATE', [['Chamomilla', 3], ['Calcarea Carbonica', 2], ['Silicea', 2]]),
  R('r102', 'Mind', 'RESTLESSNESS, anxious', [['Arsenicum Album', 4], ['Aconitum Napellus', 3], ['Rhus Toxicodendron', 2]]),
  R('r103', 'Mind', 'SADNESS', [['Natrum Muriaticum', 3], ['Ignatia Amara', 3], ['Pulsatilla Nigricans', 2]]),
  R('r104', 'Mind', 'SHRIEKING', [['Stramonium', 4], ['Hyoscyamus Niger', 3], ['Belladonna', 2]]),
  R('r105', 'Mind', 'SUSPICIOUS', [['Hyoscyamus Niger', 3], ['Anacardium Orientale', 3], ['Lachesis Mutus', 2]]),
  R('r106', 'Mind', 'TALKING, one subject, constantly', [['Lachesis Mutus', 3], ['Hyoscyamus Niger', 2], ['Stramonium', 2]]),
  R('r107', 'Mind', 'WEEPING, tendency', [['Pulsatilla Nigricans', 4], ['Natrum Muriaticum', 2], ['Ignatia Amara', 2]]),
  R('r108', 'Mind', 'WILL, weakness of', [['Phosphoric Acid', 3], ['Sepia Officinalis', 2], ['Nux Vomica', 2]]),

  // ── Generals (extended) ──
  R('r109', 'Generals', 'ANAEMIA', [['Ferrum Metallicum', 3], ['Calcarea Phosphorica', 3], ['China Officinalis', 2]]),
  R('r110', 'Generals', 'ASCITES', [['Apis Mellifica', 3], ['Arsenicum Album', 2], ['China Officinalis', 2]]),
  R('r111', 'Generals', 'CARCINOMATOUS cachexia', [['Arsenicum Album', 3], ['Cadmium Sulphuratum', 2], ['Hydrastis Canadensis', 2]]),
  R('r112', 'Generals', 'CHILLINESS', [['Calcarea Carbonica', 3], ['Silicea', 3], ['Arsenicum Album', 2]]),
  R('r113', 'Generals', 'COLLAPSE', [['Camphora', 3], ['Carbo Vegetabilis', 3], ['Veratrum Album', 2]]),
  R('r114', 'Generals', 'CONVULSIONS', [['Cuprum Metallicum', 3], ['Belladonna', 3], ['Cicuta Virosa', 2]]),
  R('r115', 'Generals', 'CYANOSIS', [['Carbo Vegetabilis', 3], ['Lachesis Mutus', 2], ['Digitalis Purpurea', 2]]),
  R('r116', 'Generals', 'DEHYDRATION', [['China Officinalis', 3], ['Arsenicum Album', 2], ['Phosphoric Acid', 2]]),
  R('r117', 'Generals', 'DROPSY', [['Apis Mellifica', 4], ['Arsenicum Album', 3], ['Apocynum Cannabinum', 2]]),
  R('r118', 'Generals', 'EMACIATION', [['Natrum Muriaticum', 3], ['Iodum', 3], ['Abrotanum', 2]]),
  R('r119', 'Generals', 'FAINTNESS', [['Nux Moschata', 3], ['Ignatia Amara', 2], ['Gelsemium', 2]]),
  R('r120', 'Generals', 'FOOD and drinks, desires, cold drinks', [['Phosphorus', 4], ['Veratrum Album', 2], ['Arsenicum Album', 2]]),
  R('r121', 'Generals', 'FOOD and drinks, desires, eggs', [['Calcarea Carbonica', 3], ['Natrum Muriaticum', 2], ['Sulphur', 2]]),
  R('r122', 'Generals', 'FOOD and drinks, desires, fat', [['Pulsatilla Nigricans', 2], ['Calcarea Carbonica', 2], ['Nux Vomica', 2]]),
  R('r123', 'Generals', 'FOOD and drinks, desires, sour', [['Ignatia Amara', 3], ['Sepia Officinalis', 2], ['Nitricum Acidum', 2]]),
  R('r124', 'Generals', 'FOOD and drinks, desires, spicy', [['Phosphorus', 2], ['Nux Vomica', 2], ['Capsicum Annuum', 2]]),
  R('r125', 'Generals', 'FOOD and drinks, aversion, meat', [['Sepia Officinalis', 3], ['Natrum Muriaticum', 2], ['Pulsatilla Nigricans', 2]]),
  R('r126', 'Generals', 'FOOD and drinks, aversion, bread', [['Natrum Muriaticum', 2], ['Bryonia Alba', 2], ['Lycopodium Clavatum', 2]]),
  R('r127', 'Generals', 'HEMORRHAGE', [['Phosphorus', 3], ['Crotalus Horridus', 3], ['Hamamelis Virginiana', 2]]),
  R('r128', 'Generals', 'INJURIES, bruises', [['Arnica Montana', 4], ['Bellis Perennis', 2], ['Hypericum Perforatum', 2]]),
  R('r129', 'Generals', 'INJURIES, nerves', [['Hypericum Perforatum', 4], ['Ledum Palustre', 2], ['Staphysagria', 2]]),
  R('r130', 'Generals', 'INJURIES, spine', [['Hypericum Perforatum', 4], ['Natrum Sulphuricum', 2], ['Ruta Graveolens', 2]]),
  R('r131', 'Generals', 'NAUSEA, constant', [['Ipecacuanha', 4], ['Cocculus Indicus', 2], ['Sepia Officinalis', 2]]),
  R('r132', 'Generals', 'OBESITY', [['Calcarea Carbonica', 3], ['Graphites', 2], ['Antimonium Crudum', 2]]),
  R('r133', 'Generals', 'ODOR of body, offensive', [['Sulphur', 3], ['Psorinum', 3], ['Mercurius Solubilis', 2]]),
  R('r134', 'Generals', 'PAIN, neuralgic', [['Magnesia Phosphorica', 3], ['Spigelia Anthelmia', 3], ['Colocynthis', 2]]),
  R('r135', 'Generals', 'PAIN, stitching', [['Bryonia Alba', 4], ['Kali Carbonicum', 2], ['Apis Mellifica', 2]]),
  R('r136', 'Generals', 'PAIN, tearing', [['Colocynthis', 2], ['Rhus Toxicodendron', 2], ['Chamomilla', 2]]),
  R('r137', 'Generals', 'PARALYSIS', [['Causticum', 3], ['Gelsemium', 2], ['Plumbum Metallicum', 2]]),
  R('r138', 'Generals', 'SEPSIS', [['Pyrogenium', 3], ['Arsenicum Album', 2], ['Lachesis Mutus', 2]]),
  R('r139', 'Generals', 'SHOCK, surgical', [['Arnica Montana', 3], ['Opium', 2], ['Aconitum Napellus', 2]]),
  R('r140', 'Generals', 'SWELLING, general', [['Apis Mellifica', 3], ['Rhus Toxicodendron', 2], ['Arsenicum Album', 2]]),
  R('r141', 'Generals', 'TREMBLING, external', [['Gelsemium', 4], ['Argentum Nitricum', 3], ['Cocculus Indicus', 2]]),
  R('r142', 'Generals', 'VACCINATION, ailments after', [['Thuja Occidentalis', 4], ['Silicea', 3], ['Malandrinum', 2]]),
  R('r143', 'Generals', 'WEAKNESS, nervous', [['Gelsemium', 3], ['Phosphoric Acid', 3], ['Kali Phosphoricum', 2]]),

  // ── Head ──
  R('r144', 'Head', 'PAIN, headache, afternoon', [['Lycopodium Clavatum', 3], ['Sulphur', 2], ['Gelsemium', 2]]),
  R('r145', 'Head', 'PAIN, headache, evening', [['Pulsatilla Nigricans', 2], ['Sulphur', 2], ['Nux Vomica', 2]]),
  R('r146', 'Head', 'PAIN, headache, night', [['Arsenicum Album', 2], ['Nux Vomica', 2], ['Rhus Toxicodendron', 2]]),
  R('r147', 'Head', 'PAIN, headache, periodic', [['Cedron', 3], ['Sanguinaria Canadensis', 2], ['China Officinalis', 2]]),
  R('r148', 'Head', 'PAIN, headache, vertex', [['Silicea', 2], ['Calcarea Carbonica', 2], ['Sulphur', 2]]),
  R('r149', 'Head', 'PAIN, headache, occiput', [['Gelsemium', 3], ['Silicea', 2], ['Natrum Muriaticum', 2]]),
  R('r150', 'Head', 'PAIN, headache, forehead', [['Natrum Muriaticum', 2], ['Bryonia Alba', 2], ['Pulsatilla Nigricans', 2]]),
  R('r151', 'Head', 'PAIN, headache, temples', [['Belladonna', 3], ['Glonoinum', 2], ['Spigelia Anthelmia', 2]]),
  R('r152', 'Head', 'PAIN, headache, cold, from taking', [['Dulcamara', 3], ['Rhus Toxicodendron', 2], ['Bryonia Alba', 2]]),
  R('r153', 'Head', 'PAIN, headache, heat, from', [['Belladonna', 3], ['Glonoine', 2], ['Lachesis Mutus', 2]]),
  R('r154', 'Head', 'PAIN, headache, noise, from', [['Nux Vomica', 2], ['Belladonna', 2], ['Natrum Carbonicum', 2]]),
  R('r155', 'Head', 'PAIN, headache, stooping, from', [['Bryonia Alba', 3], ['Kali Carbonicum', 2], ['Silicea', 2]]),
  R('r156', 'Head', 'PAIN, headache, better open air', [['Pulsatilla Nigricans', 3], ['Aconitum Napellus', 2], ['Arsenicum Album', 2]]),
  R('r157', 'Head', 'PAIN, headache, school girls', [['Natrum Muriaticum', 3], ['Calcarea Phosphorica', 2], ['Ignatia Amara', 2]]),
  R('r158', 'Head', 'PERSPIRATION, head, on', [['Calcarea Carbonica', 4], ['Silicea', 3], ['Mercurius Solubilis', 2]]),
  R('r159', 'Head', 'VERTIGO, with headache', [['Gelsemium', 3], ['Nux Vomica', 2], ['Cocculus Indicus', 2]]),

  // ── Eye ──
  R('r160', 'Eye', 'CATARACT', [['Calcarea Fluorica', 3], ['Silicea', 2], ['Natrum Muriaticum', 2]]),
  R('r161', 'Eye', 'STYES', [['Pulsatilla Nigricans', 3], ['Staphysagria', 3], ['Sulphur', 2]]),
  R('r162', 'Eye', 'PHOTOPHOBIA', [['Belladonna', 3], ['Euphrasia Officinalis', 2], ['Gelsemium', 2]]),
  R('r163', 'Eye', 'ULCERS, cornea', [['Mercurius Solubilis', 3], ['Silicea', 2], ['Calcarea Sulphurica', 2]]),
  R('r164', 'Eye', 'VISION, dim', [['Gelsemium', 3], ['Natrum Muriaticum', 2], ['Causticum', 2]]),
  R('r165', 'Eye', 'VISION, flickering', [['Natrum Muriaticum', 2], ['Lilium Tigrinum', 2], ['Sepia Officinalis', 2]]),

  // ── Ear ──
  R('r166', 'Ear', 'DISCHARGE, ear, offensive', [['Tellurium', 3], ['Mercurius Solubilis', 3], ['Psorinum', 2]]),
  R('r167', 'Ear', 'NOISES, ringing', [['China Officinalis', 3], ['Lycopodium Clavatum', 2], ['Natrum Salicylicum', 2]]),
  R('r168', 'Ear', 'DEAFNESS, catarrh, from', [['Pulsatilla Nigricans', 3], ['Kali Muriaticum', 2], ['Graphites', 2]]),
  R('r169', 'Ear', 'PAIN, earache, cold, from taking', [['Dulcamara', 3], ['Aconitum Napellus', 2], ['Belladonna', 2]]),
  R('r170', 'Ear', 'PAIN, earache, warmth amel.', [['Chamomilla', 3], ['Pulsatilla Nigricans', 2], ['Magnesia Carbonica', 2]]),

  // ── Nose ──
  R('r171', 'Nose', 'CORYZA, fluent', [['Allium Cepa', 4], ['Arsenicum Album', 2], ['Euphrasia Officinalis', 2]]),
  R('r172', 'Nose', 'CORYZA, dry', [['Nux Vomica', 3], ['Bryonia Alba', 2], ['Arum Triphyllum', 2]]),
  R('r173', 'Nose', 'CORYZA, annual', [['Dulcamara', 3], ['Sabadilla', 2], ['Wyethia', 2]]),
  R('r174', 'Nose', 'EPISTAXIS', [['Phosphorus', 3], ['Hamamelis Virginiana', 2], ['Carbo Vegetabilis', 2]]),
  R('r175', 'Nose', 'OBSTRUCTION, nose', [['Nux Vomica', 2], ['Sambucus Nigra', 2], ['Sticta Pulmonaria', 2]]),
  R('r176', 'Nose', 'SNEEZING, paroxysmal', [['Sabadilla', 3], ['Arsenicum Album', 2], ['Dulcamara', 2]]),

  // ── Face ──
  R('r177', 'Face', 'CRACKS, lips', [['Natrum Muriaticum', 3], ['Graphites', 2], ['Nitricum Acidum', 2]]),
  R('r178', 'Face', 'ERUPTIONS, eczema', [['Graphites', 3], ['Sulphur', 3], ['Petroleum', 2]]),
  R('r179', 'Face', 'ERUPTIONS, herpes', [['Natrum Muriaticum', 3], ['Rhus Toxicodendron', 2], ['Dulcamara', 2]]),
  R('r180', 'Face', 'PAIN, neuralgia, face', [['Spigelia Anthelmia', 3], ['Magnesia Phosphorica', 2], ['Colocynthis', 2]]),
  R('r181', 'Face', 'PALE', [['China Officinalis', 2], ['Veratrum Album', 2], ['Ferrum Metallicum', 2]]),
  R('r182', 'Face', 'SWELLING, face', [['Apis Mellifica', 3], ['Rhus Toxicodendron', 2], ['Arsenicum Album', 2]]),

  // ── Mouth ──
  R('r183', 'Mouth', 'APHTHAE', [['Borax', 3], ['Mercurius Solubilis', 3], ['Natrum Muriaticum', 2]]),
  R('r184', 'Mouth', 'BLEEDING, gums', [['Phosphorus', 3], ['Mercurius Solubilis', 2], ['Carbo Vegetabilis', 2]]),
  R('r185', 'Mouth', 'TASTE, bitter', [['Nux Vomica', 3], ['Pulsatilla Nigricans', 2], ['Bryonia Alba', 2]]),
  R('r186', 'Mouth', 'TASTE, salty', [['Natrum Muriaticum', 3], ['Mercurius Solubilis', 2], ['Sepia Officinalis', 2]]),
  R('r187', 'Mouth', 'TONGUE, mapped', [['Natrum Muriaticum', 3], ['Taraxacum', 2], ['Lycopodium Clavatum', 2]]),
  R('r188', 'Mouth', 'TONGUE, cracked', [['Nitricum Acidum', 2], ['Arum Triphyllum', 2], ['Natrum Muriaticum', 2]]),

  // ── Throat ──
  R('r189', 'Throat', 'PAIN, sore throat, left side', [['Lachesis Mutus', 4], ['Lycopodium Clavatum', 2], ['Apis Mellifica', 2]]),
  R('r190', 'Throat', 'PAIN, sore throat, swallowing solids', [['Belladonna', 3], ['Lachesis Mutus', 2], ['Phytolacca Decandra', 2]]),
  R('r191', 'Throat', 'PAIN, sore throat, empty swallowing', [['Ignatia Amara', 3], ['Lachesis Mutus', 2], ['Belladonna', 2]]),
  R('r192', 'Throat', 'ULCERS, throat', [['Mercurius Solubilis', 3], ['Nitricum Acidum', 2], ['Kali Bichromicum', 2]]),
  R('r193', 'Throat', 'HAWKING, constant', [['Kali Bichromicum', 3], ['Alumina', 2], ['Phosphorus', 2]]),
  R('r194', 'Throat', 'GLOBUS hystericus', [['Ignatia Amara', 4], ['Asafoetida', 2], ['Lachesis Mutus', 2]]),

  // ── Stomach ──
  R('r195', 'Stomach', 'APPETITE, increased', [['Iodum', 3], ['China Officinalis', 2], ['Sulphur', 2]]),
  R('r196', 'Stomach', 'APPETITE, wanting', [['Sepia Officinalis', 3], ['Arsenicum Album', 2], ['Carbo Vegetabilis', 2]]),
  R('r197', 'Stomach', 'ERUCTATIONS, empty', [['Lycopodium Clavatum', 3], ['Argentum Nitricum', 2], ['Carbo Vegetabilis', 2]]),
  R('r198', 'Stomach', 'ERUCTATIONS, sour', [['Nux Vomica', 3], ['Robinia Pseudacacia', 2], ['Iris Versicolor', 2]]),
  R('r199', 'Stomach', 'HEARTBURN', [['Natrum Phosphoricum', 3], ['Nux Vomica', 2], ['Pulsatilla Nigricans', 2]]),
  R('r200', 'Stomach', 'PAIN, stomach, eating after', [['Nux Vomica', 3], ['Kali Bichromicum', 2], ['Bryonia Alba', 2]]),
  R('r201', 'Stomach', 'PAIN, stomach, fasting', [['Phosphorus', 3], ['Anacardium Orientale', 2], ['Ignatia Amara', 2]]),
  R('r202', 'Stomach', 'THIRST, excessive', [['Bryonia Alba', 3], ['Phosphorus', 2], ['Arsenicum Album', 2]]),
  R('r203', 'Stomach', 'VOMITING, bile', [['Iris Versicolor', 3], ['Podophyllum', 2], ['Nux Vomica', 2]]),
  R('r204', 'Stomach', 'VOMITING, blood', [['Phosphorus', 3], ['Hamamelis Virginiana', 2], ['Ipecacuanha', 2]]),
  R('r205', 'Stomach', 'VOMITING, food', [['Antimonium Crudum', 2], ['Pulsatilla Nigricans', 2], ['Ferrum Metallicum', 2]]),
  R('r206', 'Stomach', 'VOMITING, motion, from', [['Cocculus Indicus', 4], ['Petroleum', 3], ['Tabacum', 2]]),

  // ── Abdomen ──
  R('r207', 'Abdomen', 'ASCITES', [['Apis Mellifica', 3], ['Arsenicum Album', 2], ['China Officinalis', 2]]),
  R('r208', 'Abdomen', 'COLIC, infants', [['Chamomilla', 4], ['Colocynthis', 3], ['Magnesia Phosphorica', 2]]),
  R('r209', 'Abdomen', 'DISTENSION, abdomen', [['Lycopodium Clavatum', 4], ['Carbo Vegetabilis', 3], ['China Officinalis', 2]]),
  R('r210', 'Abdomen', 'HERNIA', [['Nux Vomica', 3], ['Lycopodium Clavatum', 2], ['Calcarea Carbonica', 2]]),
  R('r211', 'Abdomen', 'PAIN, abdomen, cold, from', [['Dulcamara', 3], ['Colocynthis', 2], ['Nux Vomica', 2]]),
  R('r212', 'Abdomen', 'PAIN, abdomen, eating after', [['Nux Vomica', 3], ['Lycopodium Clavatum', 2], ['Pulsatilla Nigricans', 2]]),
  R('r213', 'Abdomen', 'TYPHLITIS', [['Bryonia Alba', 2], ['Rhus Toxicodendron', 2], ['Belladonna', 2]]),
  R('r214', 'Abdomen', 'APPENDICITIS', [['Bryonia Alba', 2], ['Rhus Toxicodendron', 2], ['Belladonna', 2]]),

  // ── Rectum ──
  R('r215', 'Rectum', 'CHOLERA', [['Veratrum Album', 4], ['Camphora', 3], ['Cuprum Metallicum', 2]]),
  R('r216', 'Rectum', 'CONSTIPATION, hard stool', [['Bryonia Alba', 3], ['Nux Vomica', 2], ['Alumina', 2]]),
  R('r217', 'Rectum', 'CONSTIPATION, no desire', [['Opium', 3], ['Alumina', 2], ['Veratrum Album', 2]]),
  R('r218', 'Rectum', 'DIARRHEA, painless', [['Phosphoric Acid', 3], ['China Officinalis', 2], ['Ferrum Metallicum', 2]]),
  R('r219', 'Rectum', 'DIARRHEA, food, after', [['Arsenicum Album', 3], ['China Officinalis', 2], ['Ferrum Metallicum', 2]]),
  R('r220', 'Rectum', 'DIARRHEA, nervous', [['Argentum Nitricum', 3], ['Gelsemium', 2], ['Lilium Tigrinum', 2]]),
  R('r221', 'Rectum', 'DYSENTERY', [['Mercurius Corrosivus', 3], ['Colocynthis', 2], ['Nux Vomica', 2]]),
  R('r222', 'Rectum', 'HEMORRHOIDS', [['Aesculus Hippocastanum', 3], ['Nux Vomica', 3], ['Collinsonia Canadensis', 2]]),
  R('r223', 'Rectum', 'HEMORRHOIDS, bleeding', [['Hamamelis Virginiana', 3], ['Phosphorus', 2], ['Millefolium', 2]]),
  R('r224', 'Rectum', 'PROLAPSUS ani', [['Podophyllum', 3], ['Ruta Graveolens', 2], ['Ignatia Amara', 2]]),
  R('r225', 'Rectum', 'WORMS', [['Cina Maritima', 4], ['Teucrium Marum Verum', 3], ['Spigelia Anthelmia', 2]]),

  // ── Urinary ──
  R('r226', 'Urinary', 'DIABETES', [['Phosphoric Acid', 3], ['Syzygium Jambolanum', 3], ['Uranium Nitricum', 2]]),
  R('r227', 'Urinary', 'GRAVEL', [['Berberis Vulgaris', 3], ['Lycopodium Clavatum', 2], ['Sarsaparilla', 2]]),
  R('r228', 'Urinary', 'INCONTINENCE, urine', [['Causticum', 3], ['Pulsatilla Nigricans', 2], ['Zincum Metallicum', 2]]),
  R('r229', 'Urinary', 'RETENTION, urine', [['Apis Mellifica', 3], ['Nux Vomica', 2], ['Opium', 2]]),
  R('r230', 'Urinary', 'STONES, kidney', [['Berberis Vulgaris', 4], ['Lycopodium Clavatum', 3], ['Sarsaparilla', 2]]),
  R('r231', 'Urinary', 'URINE, bloody', [['Cantharis', 3], ['Hamamelis Virginiana', 2], ['Terebinthina', 2]]),
  R('r232', 'Urinary', 'URINE, scanty', [['Apis Mellifica', 3], ['Arsenicum Album', 2], ['Digitalis Purpurea', 2]]),

  // ── Female ──
  R('r233', 'Female', 'ABORTION, tendency', [['Sabina', 3], ['Secale Cornutum', 2], ['Cimicifuga Racemosa', 2]]),
  R('r234', 'Female', 'BREASTS, inflammation', [['Phytolacca Decandra', 3], ['Belladonna', 2], ['Bryonia Alba', 2]]),
  R('r235', 'Female', 'BREASTS, milk, scanty', [['Urtica Urens', 3], ['Ricinus Communis', 2], ['Asafoetida', 2]]),
  R('r236', 'Female', 'FIBROIDS', [['Thlaspi Bursa Pastoris', 2], ['Calcarea Fluorica', 2], ['Fraxinus Americana', 2]]),
  R('r237', 'Female', 'INFERTILITY', [['Sepia Officinalis', 3], ['Agnus Castus', 2], ['Natrum Phosphoricum', 2]]),
  R('r238', 'Female', 'LEUCORRHEA, bland', [['Pulsatilla Nigricans', 3], ['Graphites', 2], ['Calcarea Carbonica', 2]]),
  R('r239', 'Female', 'MENOPAUSE, complaints during', [['Lachesis Mutus', 3], ['Sepia Officinalis', 3], ['Sanguinaria Canadensis', 2]]),
  R('r240', 'Female', 'MENSES, copious', [['Calcarea Carbonica', 2], ['China Officinalis', 2], ['Phosphorus', 2]]),
  R('r241', 'Female', 'MENSES, irregular', [['Pulsatilla Nigricans', 3], ['Sepia Officinalis', 2], ['Natrum Muriaticum', 2]]),
  R('r242', 'Female', 'MENSES, profuse, dark', [['Sabina', 3], ['Ipecacuanha', 2], ['Secale Cornutum', 2]]),
  R('r243', 'Female', 'MENSES, scanty', [['Pulsatilla Nigricans', 2], ['Sepia Officinalis', 2], ['Conium Maculatum', 2]]),
  R('r244', 'Female', 'OVARIAN cysts', [['Apis Mellifica', 3], ['Lachesis Mutus', 2], ['Thuja Occidentalis', 2]]),
  R('r245', 'Female', 'PROLAPSUS uteri', [['Sepia Officinalis', 4], ['Lilium Tigrinum', 2], ['Murex Purpurea', 2]]),
  R('r246', 'Female', 'VAGINITIS', [['Kreosotum', 3], ['Sepia Officinalis', 2], ['Hydrastis Canadensis', 2]]),

  // ── Male ──
  R('r247', 'Male', 'IMPOTENCE', [['Agnus Castus', 4], ['Lycopodium Clavatum', 3], ['Caladium Seguinum', 2]]),
  R('r248', 'Male', 'PROSTATE, enlarged', [['Sabal Serrulata', 3], ['Chimaphila Umbellata', 2], ['Pulsatilla Nigricans', 2]]),
  R('r249', 'Male', 'GONORRHEA', [['Medorrhinum', 3], ['Thuja Occidentalis', 2], ['Cannabis Sativa', 2]]),
  R('r250', 'Male', 'SPERMATORRHEA', [['China Officinalis', 2], ['Phosphoric Acid', 2], ['Staphysagria', 2]]),

  // ── Respiratory ──
  R('r251', 'Respiratory', 'ASTHMA, damp weather', [['Dulcamara', 3], ['Natrum Sulphuricum', 2], ['Arsenicum Album', 2]]),
  R('r252', 'Respiratory', 'ASTHMA, worse 3 AM', [['Kali Carbonicum', 3], ['Arsenicum Album', 2], ['Sambucus Nigra', 2]]),
  R('r253', 'Respiratory', 'BRONCHITIS', [['Antimonium Tartaricum', 3], ['Bryonia Alba', 2], ['Ipecacuanha', 2]]),
  R('r254', 'Respiratory', 'COUGH, barking', [['Spongia Tosta', 4], ['Hepar Sulphuris', 2], ['Aconitum Napellus', 2]]),
  R('r255', 'Respiratory', 'COUGH, deep', [['Rumex Crispus', 2], ['Drosera Rotundifolia', 2], ['Sticta Pulmonaria', 2]]),
  R('r256', 'Respiratory', 'COUGH, hollow', [['Tuberculinum', 2], ['Phosphorus', 2], ['Stannum Metallicum', 2]]),
  R('r257', 'Respiratory', 'COUGH, loose', [['Antimonium Tartaricum', 3], ['Pulsatilla Nigricans', 2], ['Ipecacuanha', 2]]),
  R('r258', 'Respiratory', 'COUGH, paroxysmal', [['Drosera Rotundifolia', 4], ['Coccus Cacti', 2], ['Corallium Rubrum', 2]]),
  R('r259', 'Respiratory', 'COUGH, whooping', [['Drosera Rotundifolia', 4], ['Corallium Rubrum', 3], ['Cuprum Metallicum', 2]]),
  R('r260', 'Respiratory', 'COUGH, worse cold air', [['Rumex Crispus', 4], ['Spongia Tosta', 2], ['Hepar Sulphuris', 2]]),
  R('r261', 'Respiratory', 'COUGH, worse lying', [['Drosera Rotundifolia', 3], ['Hyoscyamus Niger', 2], ['Manganum Aceticum', 2]]),
  R('r262', 'Respiratory', 'EXPECTORATION, bloody', [['Phosphorus', 3], ['Ipecacuanha', 2], ['Mill', 2]]),
  R('r263', 'Respiratory', 'EXPECTORATION, green', [['Pulsatilla Nigricans', 2], ['Kali Bichromicum', 2], ['Stannum Metallicum', 2]]),
  R('r264', 'Respiratory', 'EXPECTORATION, salty', [['Phosphorus', 3], ['Sepia Officinalis', 2], ['Carbo Vegetabilis', 2]]),
  R('r265', 'Respiratory', 'PNEUMONIA', [['Bryonia Alba', 3], ['Phosphorus', 2], ['Ferrum Phosphoricum', 2]]),
  R('r266', 'Respiratory', 'PLEURISY', [['Bryonia Alba', 4], ['Ranunculus Bulbosus', 2], ['Asclepias Tuberosa', 2]]),

  // ── Heart ──
  R('r267', 'Heart', 'ANGINA pectoris', [['Cactus Grandiflorus', 3], ['Spigelia Anthelmia', 2], ['Lilium Tigrinum', 2]]),
  R('r268', 'Heart', 'PALPITATION, anxiety, from', [['Aconitum Napellus', 3], ['Arsenicum Album', 2], ['Cactus Grandiflorus', 2]]),
  R('r269', 'Heart', 'PALPITATION, lying on left side', [['Lilium Tigrinum', 3], ['Phosphorus', 2], ['Natrum Muriaticum', 2]]),
  R('r270', 'Heart', 'HYPERTENSION', [['Rauwolfia Serpentina', 2], ['Crataegus Oxycantha', 2], ['Baryta Carbonica', 2]]),
  R('r271', 'Heart', 'MURMURS', [['Digitalis Purpurea', 2], ['Spongia Tosta', 2], ['Kalmia Latifolia', 2]]),

  // ── Extremities ──
  R('r272', 'Extremities', 'CRAMPS, calves', [['Calcarea Carbonica', 2], ['Silicea', 2], ['Sulphur', 2]]),
  R('r273', 'Extremities', 'GOUT', [['Colchicum Autumnale', 3], ['Ledum Palustre', 2], ['Benzoicum Acidum', 2]]),
  R('r274', 'Extremities', 'NUMBNESS, fingers', [['Plumbum Metallicum', 2], ['Gelsemium', 2], ['Hypericum Perforatum', 2]]),
  R('r275', 'Extremities', 'PAIN, sciatica', [['Colocynthis', 3], ['Rhus Toxicodendron', 3], ['Magnesia Phosphorica', 2]]),
  R('r276', 'Extremities', 'PAIN, joints, gouty', [['Colchicum Autumnale', 3], ['Ledum Palustre', 2], ['Benzoicum Acidum', 2]]),
  R('r277', 'Extremities', 'PAIN, joints, wandering', [['Pulsatilla Nigricans', 3], ['Kali Bichromicum', 2], ['Kalmia Latifolia', 2]]),
  R('r278', 'Extremities', 'RHEUMATISM, acute', [['Bryonia Alba', 3], ['Rhus Toxicodendron', 3], ['Aconitum Napellus', 2]]),
  R('r279', 'Extremities', 'RHEUMATISM, chronic', [['Rhus Toxicodendron', 3], ['Kali Carbonicum', 2], ['Causticum', 2]]),
  R('r280', 'Extremities', 'SPRAIN', [['Rhus Toxicodendron', 3], ['Arnica Montana', 2], ['Ruta Graveolens', 2]]),
  R('r281', 'Extremities', 'SWELLING, joints', [['Apis Mellifica', 3], ['Bryonia Alba', 2], ['Rhus Toxicodendron', 2]]),
  R('r282', 'Extremities', 'VARICOSE veins', [['Hamamelis Virginiana', 3], ['Pulsatilla Nigricans', 2], ['Fluoricum Acidum', 2]]),
  R('r283', 'Extremities', 'COLDNESS, feet', [['Calcarea Carbonica', 3], ['Sepia Officinalis', 2], ['Silicea', 2]]),
  R('r284', 'Extremities', 'HEAT, feet', [['Sulphur', 3], ['Chamomilla', 2], ['Medorrhinum', 2]]),

  // ── Back ──
  R('r285', 'Back', 'PAIN, coccyx', [['Hypericum Perforatum', 3], ['Aesculus Hippocastanum', 2], ['Nitricum Acidum', 2]]),
  R('r286', 'Back', 'PAIN, sacrum', [['Aesculus Hippocastanum', 2], ['Kali Carbonicum', 2], ['Natrum Muriaticum', 2]]),
  R('r287', 'Back', 'PAIN, dorsal region', [['Natrum Muriaticum', 2], ['Nux Vomica', 2], ['Phosphorus', 2]]),
  R('r288', 'Back', 'PAIN, spine, injury', [['Hypericum Perforatum', 4], ['Natrum Sulphuricum', 2], ['Ruta Graveolens', 2]]),
  R('r289', 'Back', 'STIFFNESS, neck', [['Rhus Toxicodendron', 3], ['Bryonia Alba', 2], ['Lachnanthes Tinctoria', 2]]),

  // ── Skin ──
  R('r290', 'Skin', 'ABSCESS', [['Hepar Sulphuris', 4], ['Silicea', 3], ['Calcarea Sulphurica', 2]]),
  R('r291', 'Skin', 'BOILS', [['Silicea', 3], ['Hepar Sulphuris', 3], ['Arnica Montana', 2]]),
  R('r292', 'Skin', 'BURNS', [['Cantharis', 4], ['Arsenicum Album', 2], ['Causticum', 2]]),
  R('r293', 'Skin', 'CARBUNCLE', [['Anthracinum', 3], ['Arsenicum Album', 2], ['Lachesis Mutus', 2]]),
  R('r294', 'Skin', 'CHAPPED', [['Graphites', 3], ['Petroleum', 2], ['Natrum Muriaticum', 2]]),
  R('r295', 'Skin', 'CRACKS, skin', [['Graphites', 3], ['Petroleum', 2], ['Sulphur', 2]]),
  R('r296', 'Skin', 'ECZEMA, dry', [['Graphites', 3], ['Petroleum', 2], ['Sulphur', 2]]),
  R('r297', 'Skin', 'ECZEMA, moist', [['Graphites', 3], ['Mezereum', 2], ['Dulcamara', 2]]),
  R('r298', 'Skin', 'ERUPTIONS, suppressed', [['Zincum Metallicum', 3], ['Sulphur', 2], ['Psorinum', 2]]),
  R('r299', 'Skin', 'FISTULA', [['Silicea', 3], ['Calcarea Sulphurica', 2], ['Berberis Vulgaris', 2]]),
  R('r300', 'Skin', 'FUNGUS', [['Sepia Officinalis', 2], ['Tellurium', 2], ['Graphites', 2]]),
  R('r301', 'Skin', 'HERPES, zoster', [['Ranunculus Bulbosus', 3], ['Rhus Toxicodendron', 2], ['Mezereum', 2]]),
  R('r302', 'Skin', 'IMPETIGO', [['Antimonium Tartaricum', 2], ['Graphites', 2], ['Hepar Sulphuris', 2]]),
  R('r303', 'Skin', 'INTERTRIGO', [['Graphites', 3], ['Sulphur', 2], ['Sepia Officinalis', 2]]),
  R('r304', 'Skin', 'JAUNDICE', [['Chelidonium Majus', 3], ['Myrica Cerifera', 2], ['Digitalis Purpurea', 2]]),
  R('r305', 'Skin', 'LICHEN', [['Arsenicum Album', 2], ['Antimonium Crudum', 2], ['Sulphur', 2]]),
  R('r306', 'Skin', 'PSORIASIS', [['Arsenicum Album', 2], ['Graphites', 2], ['Petroleum', 2]]),
  R('r307', 'Skin', 'RINGWORM', [['Sepia Officinalis', 2], ['Tellurium', 2], ['Bacillinum', 2]]),
  R('r308', 'Skin', 'SCARS, painful', [['Graphites', 2], ['Fluoricum Acidum', 2], ['Silicea', 2]]),
  R('r309', 'Skin', 'ULCERS, burning', [['Arsenicum Album', 3], ['Merc Solubilis', 2], ['Carbo Vegetabilis', 2]]),
  R('r310', 'Skin', 'ULCERS, indolent', [['Silicea', 3], ['Calcarea Sulphurica', 2], ['Pulsatilla Nigricans', 2]]),

  // ── Sleep ──
  R('r311', 'Sleep', 'DROWSINESS, daytime', [['Nux Moschata', 3], ['Gelsemium', 2], ['Opium', 2]]),
  R('r312', 'Sleep', 'POSITION, cannot sleep on left side', [['Lilium Tigrinum', 3], ['Phosphorus', 2], ['Spigelia Anthelmia', 2]]),
  R('r313', 'Sleep', 'SLEEP, disturbed', [['Nux Vomica', 2], ['Coffea Cruda', 2], ['Arsenicum Album', 2]]),
  R('r314', 'Sleep', 'SOMNAMBULISM', [['Phosphorus', 2], ['Stramonium', 2], ['Artemisia Vulgaris', 2]]),
  R('r315', 'Sleep', 'SNORING', [['Opium', 2], ['Lachesis Mutus', 2], ['Carbo Vegetabilis', 2]]),
  R('r316', 'Sleep', 'YAWNING, constant', [['Ignatia Amara', 2], ['Antimonium Tartaricum', 2], ['Gelsemium', 2]]),

  // ── Fever ──
  R('r317', 'Fever', 'AGUE, malarial', [['China Officinalis', 4], ['Natrum Muriaticum', 2], ['Arsenicum Album', 2]]),
  R('r318', 'Fever', 'CHILL, with heat', [['Mercurius Solubilis', 2], ['Rhus Toxicodendron', 2], ['Pulsatilla Nigricans', 2]]),
  R('r319', 'Fever', 'FEVER, intermittent', [['China Officinalis', 3], ['Natrum Muriaticum', 2], ['Ignatia Amara', 2]]),
  R('r320', 'Fever', 'FEVER, remittent', [['Bryonia Alba', 2], ['Rhus Toxicodendron', 2], ['Arsenicum Album', 2]]),
  R('r321', 'Fever', 'FEVER, typhoid', [['Baptisia Tinctoria', 3], ['Rhus Toxicodendron', 2], ['Arnica Montana', 2]]),
  R('r322', 'Fever', 'HEAT, dry, burning', [['Belladonna', 3], ['Aconitum Napellus', 2], ['Bryonia Alba', 2]]),
  R('r323', 'Fever', 'PERSPIRATION, cold', [['Veratrum Album', 3], ['Carbo Vegetabilis', 2], ['Camphora', 2]]),
  R('r324', 'Fever', 'PERSPIRATION, sour', [['Calcarea Carbonica', 2], ['China Officinalis', 2], ['Mercurius Solubilis', 2]]),
  R('r325', 'Fever', 'SHIVERING', [['Aconitum Napellus', 3], ['Nux Vomica', 2], ['Bryonia Alba', 2]]),

  // ── Vertigo ──
  R('r326', 'Vertigo', 'VERTIGO, rising from bed', [['Bryonia Alba', 2], ['Phosphorus', 2], ['Conium Maculatum', 2]]),
  R('r327', 'Vertigo', 'VERTIGO, looking up', [['Silicea', 2], ['Phosphorus', 2], ['Spigelia Anthelmia', 2]]),
  R('r328', 'Vertigo', 'VERTIGO, motion, from', [['Cocculus Indicus', 4], ['Petroleum', 3], ['Tabacum', 2]]),
  R('r329', 'Vertigo', 'VERTIGO, objects seem to turn', [['Cyclamen Europaeum', 2], ['Conium Maculatum', 2], ['Gelsemium', 2]]),

  // ── Children ──
  R('r330', 'Children', 'COLIC, infants', [['Chamomilla', 4], ['Colocynthis', 3], ['Magnesia Phosphorica', 2]]),
  R('r331', 'Children', 'DENTITION, difficult', [['Chamomilla', 4], ['Calcarea Phosphorica', 3], ['Belladonna', 2]]),
  R('r332', 'Children', 'DELAYED milestones', [['Calcarea Carbonica', 3], ['Baryta Carbonica', 3], ['Silicea', 2]]),
  R('r333', 'Children', 'ENURESIS', [['Equisetum Hyemale', 3], ['Causticum', 2], ['Kreosotum', 2]]),
  R('r334', 'Children', 'NURSING, sore mouth', [['Borax', 4], ['Mercurius Solubilis', 2], ['Natrum Muriaticum', 2]]),
  R('r335', 'Children', 'SCREAMING, children', [['Chamomilla', 3], ['Cina Maritima', 2], ['Stramonium', 2]]),
  R('r336', 'Children', 'THRUSH', [['Borax', 4], ['Mercurius Solubilis', 2], ['Helleborus Niger', 2]]),
  R('r337', 'Children', 'WHOOPING cough', [['Drosera Rotundifolia', 4], ['Corallium Rubrum', 3], ['Coccus Cacti', 2]]),

  // ── Larynx ──
  R('r338', 'Larynx', 'HOARSENESS', [['Phosphorus', 3], ['Causticum', 3], ['Argentum Nitricum', 2]]),
  R('r339', 'Larynx', 'CROUP', [['Hepar Sulphuris', 3], ['Spongia Tosta', 3], ['Aconitum Napellus', 2]]),
  R('r340', 'Larynx', 'LARYNGITIS', [['Phosphorus', 3], ['Argentum Nitricum', 2], ['Causticum', 2]]),
  R('r341', 'Larynx', 'VOICE, lost', [['Causticum', 3], ['Phosphorus', 2], ['Argentum Nitricum', 2]]),

  // ── More acute / OPD common ──
  R('r342', 'Generals', 'ALLERGY, seasonal', [['Sabadilla', 3], ['Allium Cepa', 2], ['Dulcamara', 2]]),
  R('r343', 'Generals', 'FOOD POISONING', [['Arsenicum Album', 4], ['Veratrum Album', 3], ['China Officinalis', 2]]),
  R('r344', 'Generals', 'HANGOVER', [['Nux Vomica', 4], ['Sulphur', 2], ['Lycopodium Clavatum', 2]]),
  R('r345', 'Generals', 'JET LAG', [['Cocculus Indicus', 3], ['Arnica Montana', 2], ['Gelsemium', 2]]),
  R('r346', 'Generals', 'SUNSTROKE', [['Glonoine', 4], ['Belladonna', 3], ['Natrum Carbonicum', 2]]),
  R('r347', 'Generals', 'HEAT STROKE', [['Glonoine', 4], ['Belladonna', 3], ['Natrum Carbonicum', 2]]),
  R('r348', 'Mind', 'EXAMINATION FUNK', [['Gelsemium', 4], ['Argentum Nitricum', 4], ['Lycopodium Clavatum', 2]]),
  R('r349', 'Mind', 'HOMESICKNESS', [['Capsicum Annuum', 3], ['Phosphoric Acid', 2], ['Ignatia Amara', 2]]),
  R('r350', 'Generals', 'SURGERY, before', [['Arnica Montana', 3], ['Aconitum Napellus', 2], ['Gelsemium', 2]]),
  R('r351', 'Generals', 'SURGERY, after', [['Arnica Montana', 3], ['Staphysagria', 2], ['Bellis Perennis', 2]]),
  R('r352', 'Female', 'MORNING SICKNESS', [['Sepia Officinalis', 3], ['Nux Vomica', 2], ['Symphoricarpus Racemosus', 3]]),
  R('r353', 'Female', 'LACTATION, deficient', [['Urtica Urens', 3], ['Ricinus Communis', 2], ['Asafoetida', 2]]),
  R('r354', 'Female', 'MASTITIS', [['Phytolacca Decandra', 4], ['Belladonna', 2], ['Bryonia Alba', 2]]),
  R('r355', 'Respiratory', 'HAY FEVER', [['Sabadilla', 3], ['Allium Cepa', 2], ['Wyethia', 2]]),
  R('r356', 'Respiratory', 'SINUSITIS', [['Kali Bichromicum', 3], ['Pulsatilla Nigricans', 2], ['Mercurius Solubilis', 2]]),
  R('r357', 'Head', 'MIGRAINE, one-sided', [['Iris Versicolor', 3], ['Sanguinaria Canadensis', 3], ['Spigelia Anthelmia', 2]]),
  R('r358', 'Head', 'MIGRAINE, with nausea', [['Ipecacuanha', 2], ['Iris Versicolor', 2], ['Sanguinaria Canadensis', 2]]),
  R('r359', 'Stomach', 'ACIDITY', [['Natrum Phosphoricum', 3], ['Robinia Pseudacacia', 2], ['Nux Vomica', 2]]),
  R('r360', 'Stomach', 'GASTRITIS', [['Nux Vomica', 3], ['Arsenicum Album', 2], ['Phosphorus', 2]]),
];

const dataDir = path.join(__dirname, '..', 'src', 'data', 'clinical');
const base = JSON.parse(fs.readFileSync(path.join(dataDir, 'repertory.json'), 'utf8'));
const baseIds = new Set(base.map((r) => r.id));
const unique = extended.filter((r) => !baseIds.has(r.id));
const merged = [...base, ...unique];

fs.writeFileSync(path.join(dataDir, 'repertory.json'), JSON.stringify(merged, null, 2));
console.log(`✅ Repertory: ${base.length} base + ${unique.length} new = ${merged.length} total rubrics`);
