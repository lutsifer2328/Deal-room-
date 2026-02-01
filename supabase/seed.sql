-- Seed Standard Documents
INSERT INTO public.standard_documents (id, name, description, usage_count, is_active) VALUES
('11111111-1111-1111-1111-111111110001', 'Данъчна оценка Tax Valuation Certificate', 'Издава се от общината за данъчни цели. / Issued by the municipality for tax and fee calculations.', 0, true),
('11111111-1111-1111-1111-111111110002', 'Декларация за "Видна политическа личност" (PEP) / Declaration for Politically Explosed Person', 'Попълва се от двете страни като част от мерките срещу изпирането на пари.', 1, true),
('11111111-1111-1111-1111-111111110003', 'Декларация за гражданство и гражданско състояние (чл. 25 от ЗННД) / Declaration of Citizenship', 'В нея описвате съпруг/а и режим на имуществена общност.', 0, true),
('11111111-1111-1111-1111-111111110004', 'Декларация за произход на средствата / Declaration of Origin of Funds', 'Задължителна за купувача при сделки над 30 000 лв. (по закона срещу изпирането на пари). Трябва да посочите дали парите са от заплата, заем, наследство или спестявания.', 0, true),
('11111111-1111-1111-1111-111111110005', 'Декларация за съгласие по чл. 26 от Семейния кодекс / Declaration of Consent', 'Ако имотът е лична собственост на единия съпруг (напр. наследен), но в него живее семейството, другият съпруг трябва да даде писмено съгласие за продажбата.', 1, true),
('11111111-1111-1111-1111-111111110006', 'Декларация по чл. 264 Declaration under Art. 264', 'Удостоверява липсата на държавни дългове. / Certifies that the seller has no unpaid taxes or social security.', 1, true),
('11111111-1111-1111-1111-111111110007', 'Лична карта / Паспорт ID Card / Passport', 'За удостоверяване на самоличността пред нотариуса. / To verify identity before the notary.', 2, true),
('11111111-1111-1111-1111-111111110008', 'Нотариален акт:/Proof of Ownership (Notary Deed)', 'Основният документ, който доказва кой е собственикът на имота. При сделка се съставя нов акт, който ви легитимира като новия притежател.', 0, true),
('11111111-1111-1111-1111-111111110009', 'Предварителен договор Preliminary Contract', 'Урежда условията преди финалната сделка. / Outlines the terms and price before the final transfer. purchase contract', 0, true),
('11111111-1111-1111-1111-111111110010', 'Пълномощно/Power of Attorney (PoA)', 'Ако една от страните не присъства лично. Трябва да е нотариално заверено. / If a party is not present. It must be notarized.', 0, true),
('11111111-1111-1111-1111-111111110011', 'Скица / Схема (Кадастър)Cadastral Sketch / Schema', 'Технически чертеж на имота от АГКК. / Official technical drawing showing boundaries and location.', 0, true),
('11111111-1111-1111-1111-111111110012', 'Удостоверение за наследници / Certificate of Heirs', 'Ако продавачът е получил имота/колата чрез наследство. Този документ описва кои са всички законни собственици след смъртта на наследодателя.', 0, true),
('11111111-1111-1111-1111-111111110013', 'Удостоверение за семейно положение/Certificate of Marital Status', 'Доказва дали продавачът е ерген/мома, женен или разведен. Критично при имоти!', 0, true),
('11111111-1111-1111-1111-111111110014', 'Удостоверение за сключен граждански брак/Marriage Certificate', 'Ако имотът е придобит по време на брака, той е обща собственост. / If the property was bought during marriage, it is joint property.', 0, true),
('11111111-1111-1111-1111-111111110015', 'Удостоверение за тежести Certificate of Encumbrances', 'Показва дали имотът има ипотеки или запори. / Shows if the property has mortgages, liens, or legal claims.', 0, true)
ON CONFLICT (id) DO NOTHING;

-- Seed Global Participants (A few examples)
INSERT INTO public.participants (id, name, email, phone, invitation_status) VALUES
('22222222-2222-2222-2222-222222220001', 'Ivan Petrov', 'ivan.petrov@gmail.com', '+359 888 123 456', 'accepted'),
('22222222-2222-2222-2222-222222220002', 'Maria Ivanova', 'maria.ivanova@abv.bg', '+359 888 234 567', 'accepted'),
('22222222-2222-2222-2222-222222220003', 'Georgi Dimitrov', 'g.dimitrov@remax.bg', '+359 888 345 678', 'accepted')
ON CONFLICT (id) DO NOTHING;

-- Seed a Deal
INSERT INTO public.deals (id, title, property_address, status, current_step_id) VALUES
('33333333-3333-3333-3333-333333330001', 'Luxury Apartment in Lozenets', '42 Lozenets Boulevard, Sofia', 'active', 'step_documents')
ON CONFLICT (id) DO NOTHING;

-- Link Participants to Deal
INSERT INTO public.deal_participants (id, deal_id, participant_id, role, permissions) VALUES
('44444444-4444-4444-4444-444444440001', '33333333-3333-3333-3333-333333330001', '22222222-2222-2222-2222-222222220001', 'buyer', '{"canViewDocuments": true, "canUploadDocuments": true}'),
('44444444-4444-4444-4444-444444440002', '33333333-3333-3333-3333-333333330001', '22222222-2222-2222-2222-222222220002', 'seller', '{"canViewDocuments": true, "canUploadDocuments": true}')
ON CONFLICT (id) DO NOTHING;
