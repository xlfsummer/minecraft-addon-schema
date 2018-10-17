let container = document.body;
let arr = Array.from(container.children);

let defination = {};
let currentProperty = "";
for (let i = 0, len = arr.length; i < len; i++){
    let element = arr[i];
    let tagName = element.tagName;

    if(tagName == "H3"){
        let propertyName = element.textContent;
        currentProperty = propertyName;
        defination[propertyName] = {};
        continue;
    }

    if(tagName == "H4"){
        let content = element.textContent;
        if(content == "Description"){
            let description = element.nextSibling.textContent.trim();
            defination[currentProperty].description = description;
            continue;
        }

        if(content == "Parameters"){
            defination[currentProperty].type = "object";
            continue;
        }
    }

    if(element instanceof HTMLTableElement){
        defination[currentProperty].properties = extractTableToProperty(element);
        continue;
    }
}

/**
 * @param {HTMLTableElement} table
 */
function extractTableToProperty(table){
    let schema = {};
    let columDefs = Array.from(table.rows[0].cells).map(cell => cell.textContent.trim());
    for(let i = 1, len = table.rows.length; i < len; i++){
        let currentProperty = "";
        for(let j = 0; j < columDefs.length; j++){
            let col = columDefs[j];
            let cell = table.rows[i].cells[j]
            if(col == "Name"){
                currentProperty = cell.textContent;
                schema[currentProperty] = {};
                continue;
            }

            if(col == "Type"){
                let schemaType = {
                    "Boolean": "boolean",
                    "Decimal": "number",
                    "JSON Object": "object",
                    "List": "array",
                    "Integer": "integer",
                    "String": "string"
                }[cell.textContent];

                if(schemaType){
                    schema[currentProperty].type = schemaType;
                    continue;
                }else{
                    schema[currentProperty].$ref = cell.textContent;
                }
            }

            if(col == "Default"){
                if(cell.textContent == "") continue;
                let content = cell.textContent;
                try{
                    content = JSON.parse(content);
                }catch(e){};
                schema[currentProperty].default = content;
                continue;
            }

            if(col == "Description"){
                let text = cell.childNodes[0].textContent;
                schema[currentProperty].description = text;

                let innerTable = cell.querySelector("table");
                if(innerTable){
                    let innerProp = extractTableToProperty(innerTable);
                    if(schema[currentProperty].type == "object")
                        schema[currentProperty].properties = innerProp;
                    else if(schema[currentProperty].type == "array")
                        schema[currentProperty].items = {
                            "type": "object",
                            "properties": innerProp
                        }
                }
                continue;
            }
        }
    }
    return schema;
}
