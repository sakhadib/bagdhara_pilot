import React from 'react';
import { Heart, BookOpen, Users, Mail } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Project Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold">Bagdhara Pilot</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Bengali Idiom Evaluation Platform - A research initiative for evaluating AI model responses to Bengali idiomatic expressions.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <div className="space-y-2">
              <a href="/dashboard" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Dashboard
              </a>
              <a href="/script" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Script Evaluation
              </a>
              <a href="/navigator" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Navigator
              </a>
            </div>
          </div>

          {/* Contact & Credits */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">About</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-300 text-sm">
                <Users className="w-4 h-4" />
                <span>_underscore_ Research Initiative</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300 text-sm">
                <Heart className="w-4 h-4 text-red-400" />
                <span>Built with care for linguistic research</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2025 _underscore_ Research. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm">
              Developed for Bengali Language Processing Research
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
