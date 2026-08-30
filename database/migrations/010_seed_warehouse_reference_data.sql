BEGIN;
SET search_path TO procurement, public;

INSERT INTO warehouses (warehouse_code,warehouse_name,warehouse_type,address,city,state,postcode,country,is_active,created_by,updated_by)
SELECT 'MEL-RM-01','Melbourne Raw Materials Warehouse','RAW_MATERIAL','1 Raw Materials Drive','Melbourne','VIC','3000','Australia',TRUE,1,1
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE warehouse_code='MEL-RM-01');

INSERT INTO warehouses (warehouse_code,warehouse_name,warehouse_type,address,city,state,postcode,country,is_active,created_by,updated_by)
SELECT 'MEL-FG-01','Melbourne Finished Goods Warehouse','FINISHED_GOODS','2 Finished Goods Drive','Melbourne','VIC','3000','Australia',TRUE,1,1
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE warehouse_code='MEL-FG-01');

INSERT INTO warehouses (warehouse_code,warehouse_name,warehouse_type,address,city,state,postcode,country,is_active,created_by,updated_by)
SELECT 'MEL-QA-01','Melbourne Quarantine Warehouse','QUARANTINE','3 Quality Hold Drive','Melbourne','VIC','3000','Australia',TRUE,1,1
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE warehouse_code='MEL-QA-01');

WITH w AS (SELECT warehouse_id FROM warehouses WHERE warehouse_code='MEL-RM-01')
INSERT INTO warehouse_locations (warehouse_id,location_code,location_name,location_type,aisle,rack,bin,is_receiving_location,is_quarantine_location,is_active,created_by,updated_by)
SELECT warehouse_id,'RM-REC-01','Raw Materials Receiving','RECEIVING','REC',NULL,NULL,TRUE,FALSE,TRUE,1,1 FROM w
WHERE NOT EXISTS (SELECT 1 FROM warehouse_locations wl WHERE wl.warehouse_id=w.warehouse_id AND wl.location_code='RM-REC-01');

WITH w AS (SELECT warehouse_id FROM warehouses WHERE warehouse_code='MEL-RM-01')
INSERT INTO warehouse_locations (warehouse_id,location_code,location_name,location_type,aisle,rack,bin,is_receiving_location,is_quarantine_location,is_active,created_by,updated_by)
SELECT warehouse_id,'RM-A-01','Raw Material Storage A','STORAGE','A','01','01',FALSE,FALSE,TRUE,1,1 FROM w
WHERE NOT EXISTS (SELECT 1 FROM warehouse_locations wl WHERE wl.warehouse_id=w.warehouse_id AND wl.location_code='RM-A-01');

WITH w AS (SELECT warehouse_id FROM warehouses WHERE warehouse_code='MEL-RM-01')
INSERT INTO warehouse_locations (warehouse_id,location_code,location_name,location_type,aisle,rack,bin,is_receiving_location,is_quarantine_location,is_active,created_by,updated_by)
SELECT warehouse_id,'RM-B-01','Raw Material Storage B','STORAGE','B','01','01',FALSE,FALSE,TRUE,1,1 FROM w
WHERE NOT EXISTS (SELECT 1 FROM warehouse_locations wl WHERE wl.warehouse_id=w.warehouse_id AND wl.location_code='RM-B-01');

WITH w AS (SELECT warehouse_id FROM warehouses WHERE warehouse_code='MEL-FG-01')
INSERT INTO warehouse_locations (warehouse_id,location_code,location_name,location_type,aisle,rack,bin,is_receiving_location,is_quarantine_location,is_active,created_by,updated_by)
SELECT warehouse_id,'FG-A-01','Finished Goods Storage A','STORAGE','A','01','01',FALSE,FALSE,TRUE,1,1 FROM w
WHERE NOT EXISTS (SELECT 1 FROM warehouse_locations wl WHERE wl.warehouse_id=w.warehouse_id AND wl.location_code='FG-A-01');

WITH w AS (SELECT warehouse_id FROM warehouses WHERE warehouse_code='MEL-FG-01')
INSERT INTO warehouse_locations (warehouse_id,location_code,location_name,location_type,aisle,rack,bin,is_receiving_location,is_quarantine_location,is_active,created_by,updated_by)
SELECT warehouse_id,'FG-DSP-01','Finished Goods Dispatch','DISPATCH','DSP',NULL,NULL,FALSE,FALSE,TRUE,1,1 FROM w
WHERE NOT EXISTS (SELECT 1 FROM warehouse_locations wl WHERE wl.warehouse_id=w.warehouse_id AND wl.location_code='FG-DSP-01');

WITH w AS (SELECT warehouse_id FROM warehouses WHERE warehouse_code='MEL-QA-01')
INSERT INTO warehouse_locations (warehouse_id,location_code,location_name,location_type,aisle,rack,bin,is_receiving_location,is_quarantine_location,is_active,created_by,updated_by)
SELECT warehouse_id,'QA-HOLD-01','Quarantine Hold','QUARANTINE','QA','HOLD','01',FALSE,TRUE,TRUE,1,1 FROM w
WHERE NOT EXISTS (SELECT 1 FROM warehouse_locations wl WHERE wl.warehouse_id=w.warehouse_id AND wl.location_code='QA-HOLD-01');

WITH w AS (SELECT warehouse_id FROM warehouses WHERE warehouse_code='MEL-QA-01')
INSERT INTO warehouse_locations (warehouse_id,location_code,location_name,location_type,aisle,rack,bin,is_receiving_location,is_quarantine_location,is_active,created_by,updated_by)
SELECT warehouse_id,'QA-REJ-01','Rejected Stock','QUARANTINE','QA','REJ','01',FALSE,TRUE,TRUE,1,1 FROM w
WHERE NOT EXISTS (SELECT 1 FROM warehouse_locations wl WHERE wl.warehouse_id=w.warehouse_id AND wl.location_code='QA-REJ-01');

COMMIT;

SELECT w.warehouse_code,w.warehouse_name,w.warehouse_type,wl.location_code,wl.location_name,wl.location_type,wl.is_receiving_location,wl.is_quarantine_location
FROM procurement.warehouses w
LEFT JOIN procurement.warehouse_locations wl ON wl.warehouse_id=w.warehouse_id
ORDER BY w.warehouse_code,wl.location_code;
