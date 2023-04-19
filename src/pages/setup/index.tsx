import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { Button, Col, Input, Loading, Row, Spacer, Table, Text, Tooltip } from "@nextui-org/react";
import { Key, useState } from "react";
import { open } from "@tauri-apps/api/dialog";
import { parseArgs } from "util";
import { IconButton } from "@/components/iconButton";
import { DeleteIcon } from "@/components/icons/deleteIcon";
import { ArrowUpIcon } from "@/components/icons/arrowUpIcon";
import { ArrowDownIcon } from "@/components/icons/arrowDownIcon";

// @ts-ignore
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common'
      ])),
      // Will be passed to the page component as props
    },
  }
}

export default function Router() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { databasePath } = router.query

  interface ISchematicColumn {
    key: Key,
    label: String
  }
  // Table structure
  const columns: Array<ISchematicColumn> = [
    {
      key: "level",
      label: t("level")!
    },
    {
      key: "name",
      label: t("name")!
    },
    {
      key: "path",
      label: t("file_path")!
    },
    {
      key: "actions",
      label: "Actions"
    }
  ]

  interface ISchematicRow {
    level: number,
    name: String,
    path: String
  }

  let [isNext, setNext] = useState(false)
  let [schematics, setSchematics] = useState<ISchematicRow[]>([]);

  async function addSchematic() {
    const filePath = await open({
      filters: [{
        name: 'Image',
        extensions: ['png', 'jpg', 'jpeg']
      }],
      multiple: false
    });

    let parsedPath: String;
    if (Array.isArray(filePath)) {
      parsedPath = filePath[0];
    } else if (typeof filePath === "string") {
      parsedPath = filePath as String;
    } else {
      return;
    }

    console.log("Selected:", filePath);

    const newFloor: ISchematicRow = {
      level: schematics.length + 1,
      name: t("floor") + (schematics.length + 1),
      path: parsedPath
    }

    setSchematics(prev => [
      ...prev,
      newFloor
    ])
  }

  function moveSchematic(level: number, direction: 'UP' | 'DOWN') {
    const clone = schematics
    const indexSrc = clone.findIndex(x => x.level === level)

    if (indexSrc === undefined || indexSrc === -1) {
      return
    }
    
    const indexDst = direction == 'UP' ? indexSrc - 1 : indexSrc + 1;

    console.log("Source index: " + indexSrc);
    console.log("Destination index: " + indexDst + " (max " + clone.length + ")");

    if (indexDst >= clone.length || indexDst < 0) {
      return
    }

    console.log(clone);
    
    console.log("Swap ", clone[indexSrc].path + " with " + clone[indexDst].path)

    const swapSrc = clone[indexSrc]
    const swapDst = clone[indexDst]

    for (let i = 0; i < clone.length; i++) {
      clone[i].level = i + 1
    }

    setSchematics(clone)
  }

  function deleteSchematic(index: number) {
    const clone = schematics
    clone.splice(index, 1)
    setSchematics(clone)
  }

  function setupDatabase() {
    setNext(true);
  }

  const renderCell = (schematic: ISchematicRow, columnKey: React.Key) => {
    // @ts-ignore
    const cellValue: any = schematic[columnKey];
    switch (columnKey) {
      case "level":
      case "name":
        return (
          <Text>
            {cellValue}
          </Text>
        );

      case "actions":
        return (
          <Row justify="center" align="center">
            <Col css={{ d: "flex" }}>
              <Tooltip content={t("up")}>
                <IconButton onClick={() => moveSchematic(schematic.level, 'UP')}>
                  <ArrowUpIcon size={20} />
                </IconButton>
              </Tooltip>
            </Col>
            <Col css={{ d: "flex" }}>
              <Tooltip content={t("down")}>
                <IconButton onClick={() => moveSchematic(schematic.level, 'DOWN')}>
                  <ArrowDownIcon rotate={90} size={20} />
                </IconButton>
              </Tooltip>
            </Col>
            <Col css={{ d: "flex" }}>
              <Tooltip
                content={t("delete")}
                color="error"
                onClick={() => deleteSchematic(schematic.level - 1)}
              >
                <IconButton>
                  <DeleteIcon size={20} fill="#FF0080" />
                </IconButton>
              </Tooltip>
            </Col>
          </Row>
        );
      default:
        return cellValue;
    }
  };

  return (
    <div className="flex min-h-screen flex-col content-center p-24">
      <h1>{t("setup.welcome")}</h1>
      <p>Saving at: {databasePath}</p>

      <Spacer y={3}></Spacer>
      <Input
        clearable
        bordered
        underlined
        labelPlaceholder={t("setup.plan_name")!}
        initialValue={t("setup.initial_name")!}
        color="primary"
      />

      <Spacer y={1.5}></Spacer>
      <Text h3>Schematics</Text>
      <Text>{t("setup.select_schematic_label")}</Text>
      {schematics.length > 0 &&
        <>
          <Spacer y={1}></Spacer>
          <Table
            bordered={false}
            css={{
              height: "auto",
              minWidth: "100%",
            }}>
            <Table.Header columns={columns}>
              {(column) => (
                <Table.Column
                  key={column.key}
                  hideHeader={column.key == "actions"}
                  align={column.key === "actions" ? "center" : "start"}>{column.label}</Table.Column>
              )}
            </Table.Header>
            <Table.Body items={schematics}>
              {(item) => (
                <Table.Row key={item.level}>
                  {(columnKey) =>
                    <Table.Cell>{renderCell(item, columnKey)}</Table.Cell>
                  }
                </Table.Row>
              )}
            </Table.Body>
          </Table>
          <Spacer y={0.5}></Spacer>
        </>
      }
      <div className="w-96 mt-3">
        <Button onPress={addSchematic}>
          <svg xmlns="http://www.w3.org/2000/svg" className="p-1.5" width="36" height="36" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M15 8h.01"></path>
            <path d="M12.5 21h-6.5a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v6.5"></path>
            <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l4 4"></path>
            <path d="M14 14l1 -1c.67 -.644 1.45 -.824 2.182 -.54"></path>
            <path d="M16 19h6"></path>
            <path d="M19 16v6"></path>
          </svg>

          <Text>{t("setup.select_schematic")} (.png, .jpg)</Text>
        </Button>
      </div>

      <Spacer y={4}></Spacer>
      {!isNext &&
        <Button color="gradient" auto onPress={setupDatabase}>
          {t("next")}
        </Button>
      }

      {isNext &&
        <Button disabled auto bordered color="gradient" css={{ px: "$13" }}>
          <Loading color="currentColor" size="sm" />
        </Button>
      }
    </div>
  )
}