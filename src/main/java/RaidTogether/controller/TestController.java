package RaidTogether.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @Value("${test.key}")
    String secret;

    @RequestMapping("/")
    public String test(){
        return "pipe line works => " + secret;
    }
}
