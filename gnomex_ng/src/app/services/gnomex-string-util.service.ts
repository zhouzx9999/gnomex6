import {Injectable} from "@angular/core";
import {Http, Response, URLSearchParams} from "@angular/http";
import {Observable} from "rxjs/Observable";

import 'rxjs/add/operator/map';

@Injectable()
export class GnomexStringUtilService {

    constructor(private http: Http) {
    }
    public static stripHTMLText(htmlText:String):String {
        var pattern:RegExp = /<P.*?>/g;
        var str:String = htmlText.replace(pattern, "");
        pattern = /<\/P.*?>/g;
        str = str.replace(pattern, "");
        pattern = /<B.*?>/g;
        str = str.replace(pattern, "");
        pattern = /<\/B.*?>/g;
        str = str.replace(pattern, "");
        pattern = /<U.*?>/g;
        str = str.replace(pattern, "");
        pattern = /<\/U.*?>/g;
        str = str.replace(pattern, "");
        pattern = /<LI.*?>/g;
        str = str.replace(pattern, "");
        pattern = /<\/LI.*?>/g;
        str = str.replace(pattern, "");
        pattern = /<I.*?>/g;
        str = str.replace(pattern, "");
        pattern = /<\/I.*?>/g;
        str = str.replace(pattern, "");

        //pattern = /<U.*?>/g;
        //str = str.replace(pattern, "");
        //pattern = /<\/U.*?>/g;
        //str = str.replace(pattern, "");
        return GnomexStringUtilService.cleanRichTextHTML(str);
    }

    public static cleanRichTextHTML(htmlText:String):String {
        var pattern:RegExp = /<TEXTFORMAT.*?>/g;
        var str:String = htmlText.replace(pattern, "");
        pattern = /<FONT.*?>/g;
        str = str.replace(pattern, "");
        pattern = /<\/FONT.*?>/g;
        str = str.replace(pattern, "");
        pattern = /<\/TEXTFORMAT.*?>/g;
        str = str.replace(pattern, "");

        return str;
    }





}