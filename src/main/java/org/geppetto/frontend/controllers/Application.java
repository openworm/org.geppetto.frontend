package org.geppetto.frontend.controllers;

import org.geppetto.core.auth.IAuthService;
import org.osgi.framework.BundleContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class Application {

    @Autowired
    BundleContext bundleContext;

    @Autowired(required = false)
    IAuthService authService;

    public Application() {
    }

    @RequestMapping(value = "/", method = RequestMethod.GET)
    public String home() {

        if (authService == null || authService.isAuthenticated()) {
            return "home";
        } else {
            return "redirect:" + authService.authFailureRedirect();
        }
    }

    @RequestMapping(value = "/GeppettoTests.html", method = RequestMethod.GET)
    public String test() {
        return "geppettotests";
    }

}