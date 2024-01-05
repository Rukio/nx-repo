# Athena Listener Service

## Running Athena Listener Service

```sh
make ensure-docker ensure-dev-kafka ensure-dev-redis run-go-athena-listener-service
```

## Create a topic locally

```sh
# Get a list of the containers
docker ps
# Get the container ID, then shell into the container
docker exec -it [containerid] sh
# Create a topic named "dev.athena.changed-lab-results"
/opt/bitnami/kafka/bin/kafka-topics.sh --create --topic dev.athena.changed-lab-results --bootstrap-server localhost:9092
```

## View Kafka information

```sh
brew install kcat
# List all brokers and topics
kcat -L -b localhost
# Start consuming a topic
kcat -b localhost:9092 -t dev.athena.changed-lab-results
```

## HL7 Message

AthenaHealth exposes the ability to manually upload an HL7 message to be processed. This is useful for testing workflows such as ([the iStat lab results flow](https://github.com/*company-data-covered*/services/blob/trunk/docs/architecture/patients/listener.md#kafka-infrastructure)) end to end.

HL7 Upload Steps:

1. Open the [AthenaHealth UI](https://preview.athenahealth.com/13869/12/globalframeset.esp)
2. Click on the gear icon and navigate to Admin -> Practice Manager
3. Click on Interface -> Interface File Upload
4. Pick an Interface Vendor with Source = Text
5. Copy/paste an HL7 message into the text box
   1. If you copy/paste the example for testing, the important fields to change are
      - PID.3 (`405010`), the patient ID
      - OBR.2 (`4124653` from `4124653H13869`), the order ID

## Example HL7 message

[HL7 Reference Format](https://hl7-definition.caristix.com/v2/HL7v2.5)

This is an example HL7 message of a lab result from a CG4+ ISTAT machine.

```
MSH|^~\&|LAB|DEN||13869|20230227145800-07:00||ORU^R01^ORU_R01|18|P|2.5|||AL|AL
PID|1||405010|||||||||||||||4124653
ORC|NW|||||||||||||||||325511
OBR|1|4124653H13869||CG4IS2^CG4+ ISTAT|||20230227145800-07:00||||O|||||440^^^||Colorado^DENN||219W221980243||||||||||||||49420|DENN
OBX|1|ST|LAC^LAC||0.77|mmol/L|0.9-1.70||||F|||||49420||325511|20230227145800-07:00
OBX|2|ST|PCO2^PCO2||33.4|mmHg|||||F|||20230302084827-07:00||49420|M|325511|20230302084827-07:00
```

The HL7 message is broken up into several segments, with one segment per line.

### MSH Message Header

The first segment ([`MSH`](https://www.hl7.org/documentcenter/public/wg/conf/HL7MSH.htm)) is the message header.

`MSH|^~\&|LAB|DEN||13869|20230227145800-07:00||ORU^R01^ORU_R01|18|P|2.5|||AL|AL`

- `|` is the delimiter and `^~\&` are the encoding characters. More detail about the encoding characters can be found in the above link.
- `LAB` is the sending application.
- `DEN` is the sending facility.
- `13869` is the receiving facility
- `20230227145800-07:00` is the timestamp of the message.
- [`ORU^R01^ORU_R01`](https://www.interfaceware.com/hl7-oru) is the message type. `ORU` stands for "Observation Result", and `ORU^R01` is an unsolicited transmission of an observation result. By the schema definition of an `ORU^R01` message, it will include later `PID` (patient ID) and `OBR` (observation request) segments.
- `18` is the message control ID, which is a unique ID for the message. `P` is the processing ID, and stands for "production" (versus `D` for "debugging" or `T` for "training").
- `2.5` is the version ID. This corresponds to HL7 v2.5.
- `AL` is the accept acknowledgement type, which determines when ACKs are required to be returned in response to the message. `AL` stands for "always" (versus `NE` for "never", `ER` for "error", `SU` for "success").
- `AL` is the application acknowledgement type, which determines when ACKs are required to be returned in response to the message.

### PID Patient Identification

The second segment ([`PID`](https://v2plus.hl7.org/2021Jan/segment-definition/PID.html)) is the patient identification segment.

`PID|1||405010|||||||||||||||4124653`

- `1` is the set ID. If there were a second `PID` segment in this HL7 message, it would have set ID of `2`.
- No patient ID field is included, as it was deprecated in favor of the patient ID list field.
- `405010` is the patient ID list. In this case, it is a list of size 1.
- `4124653` is the patient account number, which is a number used by billing.

### ORC Common Order

The third segment ([`ORC`](https://v2plus.hl7.org/2021Jan/segment-definition/ORC.html)) is the common order segment. This is used to transmit fields common to all orders.

`ORC|NW|||||||||||||||||325511`

- `NW` is the order control ID. `NW` stands for "New Order".
- `325511` is the entering device. This should be the ID of the iStat machine.

### OBR Observation Request

The fourth segment ([`OBR`](https://v2plus.hl7.org/2021Jan/segment-definition/OBR.html)) is the observation request segment.

`OBR|1|4124653H13869||CG4IS2^CG4+ ISTAT|||20230227145800-07:00||||O|||||440^^^||Colorado^DENN||219W221980243||||||||||||||49420|DENN`

- `1` is the set ID. If there were a second `OBR` segment in this HL7 message, it would have set ID of `2`.
- `4124653H13869` is the placer order number. `4124653` is the order ID, `H` seems to be a delimiter, `13869` is the athena practice ID. When uploading a lab result via HL7 to Athena, this order number is what is used to identify the lab order that this is a lab result of.
- `CG4IS2^CG4+ ISTAT` is the universal service identifier. `CG4IS2` is the identifier and `CG4+ ISTAT` is a human readable text description.
- `20230227145800-07:00` is the timestamp of the observation.
- `O` is the [specimen action code](https://hl7-definition.caristix.com/v2/HL7v2.5/Tables/0065). `O` stands for "other", and indicates that the specimen was collected by a service other than the lab.
- `440^^^` is the ordering provider. `440` is the ID number of the provider.
- `Colorado^DENN` is the first placer field, and is a placer-defined field (aka Dispatch). This field was sent out with the order, and is echoed back in the result.
- `219W221980243` is the first filler field, and is a filler-defined field. This field was created by the lab (aka Abbott).
- `49420` is the technician, and is the ID of the technician responsible for this operation.

### OBX Observation/Result

The fifth and sixth segments ([`OBX`](https://v2plus.hl7.org/2021Jan/segment-definition/OBX.html)) are observation/result segments.

`OBX|1|ST|LAC^LAC||0.77|mmol/L|0.9-1.70||||F|||||49420||325511|20230227145800-07:00`
`OBX|2|ST|PCO2^PCO2||33.4|mmHg|||||F|||20230302084827-07:00||49420|M|325511|20230302084827-07:00`

- `1` and `2` are the set IDs.
- `ST` is the [value type](https://hl7-definition.caristix.com/v2/HL7v2.5/Tables/0125). `ST` stands for String.
- `LAC^LAC` and `PCO2^PCO2` are the observation identifiers. They denote results for `LAC` (lactose) and `PCO2` (partial pressure of carbon dioxide).
- `0.77` and `33.4` are the values of the results.
- `mmol/L` and `mmHg` are the units of the results.
- `0.9-1.70` is a reference range for the results, to show what a normal range looks like.
- `F` is the [observation result status](https://hl7-definition.caristix.com/v2/HL7v2.5/Tables/0085). `F` stands for "final".
- `49420` is the observer, and is the ID of the person responsible for this operation. This corresponds to the technician ID in the OBR.
- `325511` is the equipment instance identifier. This corresponds to the ID of the iStat entering device in the ORC.
- `20230227145800-07:00` is the timestamp of the analysis.
